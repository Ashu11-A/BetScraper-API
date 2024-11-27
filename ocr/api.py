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

torch.cuda.empty_cache()
gc.collect()

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
lock = threading.Lock()
is_processing = False

@app.route('/ocr', methods=['POST'])
def ocr():
    global is_processing

    # Aguarda enquanto outra requisição está em processamento
    while True:
        with lock:
            if not is_processing:
                is_processing = True
                break
        time.sleep(0.1)  # Espera ativa (polling)
    torch.cuda.empty_cache()
    gc.collect()

    # Extrair dados da requisição
    data = request.json
    imagePath = data.get('imagePath')
    print(imagePath)

    try:
        if not imagePath:
            return jsonify({'error': 'O campo "imagePath" é obrigatório.'}), 400
        if not os.path.exists(imagePath):
            return jsonify({'error': f'O arquivo {imagePath} não foi encontrado.'}), 404

        # Verifica se é um SVG e converte para PNG
        if imagePath.lower().endswith(".svg"):
            imagePath = convert_svg_to_png(imagePath)

        # plain texts OCR
        res = model.chat(tokenizer, imagePath, ocr_type='ocr')

        # multi-crop OCR:
        res = model.chat_crop(tokenizer, imagePath, ocr_type='ocr')
        res = model.chat_crop(tokenizer, imagePath, ocr_type='format')
        
        print(res)
        response = {'result': res}
        return jsonify(response), 200
        

    except Exception as e:
        print(e)
        response = {'error': str(e)}

    finally:
        del data
        del imagePath
    
        torch.cuda.empty_cache()
        gc.collect()

        # Timeout após o processamento
        time.sleep(5)
        with lock:
            is_processing = False

    return jsonify(response), 500

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
