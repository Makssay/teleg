import os
import uuid
from flask import Flask, request, jsonify, send_file
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackContext

# Flask приложение для работы с API
app = Flask(__name__)

# Директория для хранения загруженных документов и QR-кодов
UPLOAD_FOLDER = 'uploaded_documents'
QR_FOLDER = 'qr_codes'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(QR_FOLDER, exist_ok=True)

# Словарь для хранения данных о документах
documents = {}

# Telegram бота
bot_token = "8090929558:AAHdgzC-cEK4OdSlKisjvaNOmNLRHykOwIA"
tg_app = ApplicationBuilder().token(bot_token).build()

# === Telegram БОТ ===

# Обработчик команды /start
async def start(update: Update, context: CallbackContext):
    await update.message.reply_text("Добро пожаловать! Введите /manage для управления документами.")

# Обработчик команды /manage
async def manage(update: Update, context: CallbackContext):
    # URL вашего мини-приложения
    mini_app_url = "https://teleg-three.vercel.app/"

    # Создаём объект WebAppInfo
    web_app_info = WebAppInfo(url=mini_app_url)

    # Создаём клавиатуру с кнопкой для открытия мини-приложения
    keyboard = [
        [InlineKeyboardButton("Открыть мини-приложение", web_app=web_app_info)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # Отправляем сообщение с кнопкой
    await update.message.reply_text(
        "Нажмите на кнопку ниже, чтобы открыть мини-приложение:",
        reply_markup=reply_markup
    )

# Добавляем обработчики команд
tg_app.add_handler(CommandHandler("start", start))
tg_app.add_handler(CommandHandler("manage", manage))

# === Flask API ===

# Обработка загрузки документа
@app.route('/upload', methods=['POST'])
def upload_document():
    if 'document' not in request.files:
        return jsonify({'status': 'error', 'message': 'Файл не найден'}), 400

    file = request.files['document']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'Файл не выбран'}), 400

    # Генерируем уникальное имя для файла
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # Генерация QR-кода
    qr_code_path = generate_qr_code(file_id)

    # Сохраняем данные о документе
    documents[file_id] = {
        'name': file.filename,
        'path': file_path,
        'qr_code': qr_code_path
    }

    # Возвращаем URL QR-кода
    qr_code_url = f"/qr/{file_id}"
    return jsonify({'status': 'success', 'qrCodeUrl': qr_code_url})

# Получение QR-кода
@app.route('/qr/<file_id>', methods=['GET'])
def get_qr_code(file_id):
    document = documents.get(file_id)
    if not document:
        return jsonify({'status': 'error', 'message': 'Документ не найден'}), 404

    return send_file(document['qr_code'], mimetype='image/png')

# Генерация QR-кода
def generate_qr_code(file_id):
    import qrcode
    qr_code_path = os.path.join(QR_FOLDER, f"{file_id}.png")
    qr_data = f"http://localhost:5000/qr/{file_id}"  # URL QR-кода
    qr = qrcode.make(qr_data)
    qr.save(qr_code_path)
    return qr_code_path

# Запуск Flask приложения и Telegram бота
if __name__ == '__main__':
    import threading

    # Запускаем Telegram бота в отдельном потоке
    threading.Thread(target=lambda: tg_app.run_polling()).start()

    # Запускаем Flask сервер
    app.run(host='0.0.0.0', port=5000, debug=True)
