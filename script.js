// Telegram Web Apps Initialization
Telegram.WebApp.ready();

// Массив для хранения загруженных документов
const uploadedDocuments = [];

function uploadDocument() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput.files.length === 0) {
    alert('Выберите файл для загрузки');
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('document', file);

  // Отправляем файл на сервер
  fetch('https://your-backend-url/upload', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        alert('Документ успешно загружен!');
        // Сохраняем информацию о документе
        uploadedDocuments.push({
          name: file.name,
          qrCodeUrl: data.qrCodeUrl
        });
        // Обновляем список документов
        updateDocumentList();
      } else {
        alert('Ошибка загрузки документа');
      }
    })
    .catch(error => {
      console.error('Ошибка:', error);
      alert('Не удалось загрузить документ');
    });
}

function updateDocumentList() {
  const documentList = document.getElementById('documentList');
  documentList.innerHTML = ''; // Очищаем список перед обновлением
  uploadedDocuments.forEach(doc => {
    const listItem = document.createElement('div');
    listItem.innerHTML = `
      <p>Документ: ${doc.name}</p>
      <p><a href="${doc.qrCodeUrl}" target="_blank">QR-код</a></p>
    `;
    documentList.appendChild(listItem);
  });
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

  // Если открыта вкладка "Загрузка", обновляем список документов
  if (tabId === 'uploadTab') {
    updateDocumentList();
  }
}

// Открыть первую вкладку по умолчанию
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.tab-button').click();
});
