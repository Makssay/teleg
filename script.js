// Telegram Web Apps Initialization
Telegram.WebApp.ready();

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
        addDocumentToList(file.name, data.qrCodeUrl);
      } else {
        alert('Ошибка загрузки документа');
      }
    })
    .catch(error => {
      console.error('Ошибка:', error);
      alert('Не удалось загрузить документ');
    });
}

function addDocumentToList(name, qrCodeUrl) {
  const documentList = document.getElementById('documentList');
  const listItem = document.createElement('div');
  listItem.innerHTML = `
    <p>Документ: ${name}</p>
    <p><a href="${qrCodeUrl}" target="_blank">QR-код</a></p>
  `;
  documentList.appendChild(listItem);
}
