from flask import Flask, request, jsonify
from transformers import AutoModel, AutoTokenizer
from PIL import Image
import threading
import cairosvg
import torch
import time
import os
import gc
import io
from queue import Queue

torch.cuda.empty_cache()
gc.collect()

# Função para converter SVG em PNG
def convert_svg_to_png(svg_path):
    try:
        # Converte SVG para PNG usando CairoSVG
        png_bytes = cairosvg.svg2png(url=svg_path)
        # Cria uma imagem PIL a partir do PNG
        image = Image.open(io.BytesIO(png_bytes))
        # Salva como um arquivo temporário para passar ao modelo
        temp_png_path = svg_path.replace(".svg", ".png")
        image.save(temp_png_path, format="PNG")
        return temp_png_path
    except Exception as e:
        raise ValueError(f"Erro ao converter SVG: {e}")

# Configuração do Flask
app = Flask(__name__)

# Carregar o modelo e tokenizer
tokenizer = AutoTokenizer.from_pretrained('ucaslcl/GOT-OCR2_0', trust_remote_code=True)
model = AutoModel.from_pretrained(
    'ucaslcl/GOT-OCR2_0',
    trust_remote_code=True,
    low_cpu_mem_usage=True,
    device_map='cuda',
    use_safetensors=True,
    pad_token_id=tokenizer.eos_token_id
).eval().cuda()

# Variáveis de controle
max_concurrent_requests = 2
active_requests = Queue(maxsize=max_concurrent_requests)  # Limitar a 2 requisições simultâneas

# Função que processa o OCR em uma thread
def process_ocr(imagePath, response_queue):
    try:
        # Verifica se é um SVG e converte para PNG
        if imagePath.lower().endswith(".svg"):
            imagePath = convert_svg_to_png(imagePath)

        # plain texts OCR
        res = model.chat(tokenizer, imagePath, ocr_type='ocr')

        # multi-crop OCR
        res = model.chat_crop(tokenizer, imagePath, ocr_type='ocr')
        res = model.chat_crop(tokenizer, imagePath, ocr_type='format')

        print(res)

        response = {'result': res}
        response_queue.put(response)

    except Exception as e:
        print(e)
        response_queue.put({'error': str(e)})

    finally:
        torch.cuda.empty_cache()
        gc.collect()

        # Libera a thread após o processamento
        active_requests.get()
        active_requests.task_done()

@app.route('/ocr', methods=['POST'])
def ocr():
    # Aguarda até que haja espaço na fila para a requisição
    active_requests.put(1)  # Isso vai bloquear até que a fila tenha espaço

    # Extrair dados da requisição
    data = request.json
    imagePath = data.get('imagePath')

    if not imagePath:
        return jsonify({'error': 'O campo "imagePath" é obrigatório.'}), 400

    if not os.path.exists(imagePath):
        return jsonify({'error': f'O arquivo {imagePath} não foi encontrado.'}), 404

    response_queue = Queue()

    # Criar thread para processar o OCR
    thread = threading.Thread(target=process_ocr, args=(imagePath, response_queue))
    thread.start()

    # Aguardar a resposta da thread
    response = response_queue.get()

    # Verifica se houve erro no processamento
    if 'error' in response:
        # Se o erro estiver presente, retorna 400 com a mensagem de erro
        return jsonify({'error': response['error']}), 400

    return jsonify(response), 200

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
