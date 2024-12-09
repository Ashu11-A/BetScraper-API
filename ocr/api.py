from flask import Flask, request, jsonify
from PIL import Image
import threading
import cairosvg
import torch
import os
import gc
from queue import Queue
import io

from paddleocr import PaddleOCR

# Paddleocr supports Chinese, English, French, German, Korean, and Japanese.
# You can set the parameter `lang` as `ch`, `en`, `fr`, `german`, `korean`, `japan`
# to switch the language model in order.
ocr = PaddleOCR(use_angle_cls=True, lang='en')  # need to run only once to download and load model into memory

torch.cuda.empty_cache()
gc.collect()

# Função para converter SVG em PNG
def convertSvgToPng(svgPath):
    try:
        # Converte SVG para PNG usando CairoSVG
        pngBytes = cairosvg.svg2png(url=svgPath)
        # Cria uma imagem PIL a partir do PNG
        image = Image.open(io.BytesIO(pngBytes))
        # Salva como um arquivo temporário para passar ao modelo
        tempPngPath = svgPath.replace(".svg", ".png")
        image.save(tempPngPath, format="PNG")
        return tempPngPath
    except Exception as e:
        raise ValueError(f"Erro ao converter SVG: {e}")

# Configuração do Flask
app = Flask(__name__)

# Variáveis de controle
maxConcurrentRequests = 1000
activeRequests = Queue(maxsize=maxConcurrentRequests)  # Limitar a 2 requisições simultâneas

# Função que processa o OCR em uma thread
def processOcr(imagePath, responseQueue):
    try:
        # Verifica se é um SVG e converte para PNG
        if imagePath.lower().endswith(".svg"):
            imagePath = convertSvgToPng(imagePath)
            
        print(imagePath)

        result = ocr.ocr(imagePath, cls=True)
        
        print(result)

        if not result or result == [None]:
            responseQueue.put({'error': 'Nenhum texto detectado na imagem.'})
            return

        recognizedTextArray = []

        for idx in range(len(result)):
            res = result[idx]
            
            for line in res:
                recognizedText = line[1][0]
                
                # Adiciona o texto reconhecido à lista
                recognizedTextArray.append(recognizedText)

        response = {'result': recognizedTextArray}
        responseQueue.put(response)

    except Exception as e:
        print(e)
        responseQueue.put({'error': str(e)})

    finally:
        torch.cuda.empty_cache()
        gc.collect()

        # Libera a thread após o processamento
        activeRequests.get()
        activeRequests.task_done()

@app.route('/ocr', methods=['POST'])
def ocrProcess():
    # Aguarda até que haja espaço na fila para a requisição
    activeRequests.put(1000)  # Isso vai bloquear até que a fila tenha espaço

    # Extrair dados da requisição
    data = request.json
    imagePath = data.get('imagePath')

    if not imagePath:
        return jsonify({'error': 'O campo "imagePath" é obrigatório.'}), 400

    if not os.path.exists(imagePath):
        return jsonify({'error': f'O arquivo {imagePath} não foi encontrado.'}), 404

    responseQueue = Queue()

    # Criar thread para processar o OCR
    thread = threading.Thread(target=processOcr, args=(imagePath, responseQueue))
    thread.start()

    # Aguardar a resposta da thread
    response = responseQueue.get()

    # Verifica se houve erro no processamento
    if 'error' in response:
        # Se o erro estiver presente, retorna 400 com a mensagem de erro
        return jsonify({'error': response['error']}), 400

    return jsonify(response), 200

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
