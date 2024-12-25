// Telegram Web Apps Initialization
Telegram.WebApp.ready();

// Массив для хранения загруженных документов
const uploadedDocuments = [];

// URL сервера
const SERVER_URL = 'https://76c7-95-24-20-127.ngrok-free.app'; // Замените на URL вашего сервера

function uploadDocument() {
  const fileInput = document.getElementById('fileInput');
  const statusMessage = document.getElementById('statusMessage');

  if (fileInput.files.length === 0) {
    statusMessage.textContent = 'Пожалуйста, выберите файл для загрузки!';
    statusMessage.style.color = 'red';
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('document', file);

  // Отображаем сообщение о начале загрузки
  statusMessage.textContent = 'Загрузка файла...';
  statusMessage.style.color = 'blue';

  // Отправляем файл на сервер
  fetch(`${SERVER_URL}/upload`, {
    method: 'POST',
    body: formData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.status === 'success') {
        // Сохраняем информацию о документе
        uploadedDocuments.push({
          name: file.name,
          url: `${SERVER_URL}${data.file_url}`,
          qrCodeUrl: `${SERVER_URL}${data.qr_code_url}`
        });
        // Обновляем список документов
        updateDocumentList();
        statusMessage.textContent = 'Документ успешно загружен!';
        statusMessage.style.color = 'green';
      } else {
        throw new Error(data.message || 'Ошибка при загрузке документа');
      }
    })
    .catch(error => {
      console.error('Ошибка при загрузке:', error);
      statusMessage.textContent = 'Не удалось загрузить документ. Проверьте сервер.';
      statusMessage.style.color = 'red';
    });
}

function updateDocumentList() {
  const documentList = document.getElementById('documentList');
  documentList.innerHTML = ''; // Очищаем список перед обновлением
  uploadedDocuments.forEach((doc, index) => {
    const listItem = document.createElement('div');
    listItem.className = 'document-item'; // Для стилей, если нужно
    listItem.innerHTML = `
      <p>${doc.name}</p>
      <button onclick="openDocument(${index})">Открыть документ</button>
      <button onclick="showQrCode(${index})">Показать QR-код</button>
    `;
    documentList.appendChild(listItem);
  });
}

// Открытие документа
function openDocument(index) {
  const documentUrl = uploadedDocuments[index]?.url;
  if (documentUrl) {
    window.open(documentUrl, '_blank');
  } else {
    alert('Документ не найден.');
  }
}

// Открытие QR-кода в модальном окне
function showQrCode(index) {
  const qrCodeUrl = uploadedDocuments[index]?.qrCodeUrl;
  if (qrCodeUrl) {
    const modal = document.getElementById('qrModal');
    const qrImage = document.getElementById('qrImage');
    qrImage.src = qrCodeUrl; // Устанавливаем URL для изображения
    modal.style.display = 'flex'; // Показываем модальное окно
  } else {
    alert('QR-код не найден.');
  }
}

// Закрытие модального окна
function closeQrModal() {
  const modal = document.getElementById('qrModal');
  modal.style.display = 'none'; // Закрываем модальное окно
}

function openTab(evt, tabId) {
  // Скрыть все вкладки
  const tabs = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].style.display = 'none';
  }

  // Убрать класс "active" у всех кнопок
  const buttons = document.getElementsByClassName('tab-button');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active');
  }

  // Показать выбранную вкладку
  document.getElementById(tabId).style.display = 'block';

  // Добавить класс "active" к нажатой кнопке
  evt.currentTarget.classList.add('active');
}

// Открыть первую вкладку по умолчанию
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.tab-button').click();
});
