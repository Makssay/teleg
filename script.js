// Telegram Web Apps Initialization
Telegram.WebApp.ready();

// URL сервера
const SERVER_URL = 'https://0d14-95-24-20-127.ngrok-free.app'; // Замените на URL вашего сервера

// Профиль пользователя
let userProfile = {
  id: 'guest',
  name: 'Гость',
};

// Инициализация данных пользователя
function initializeUserProfile() {
  const userData = Telegram.WebApp.initDataUnsafe?.user;
  if (userData) {
    userProfile.id = userData.id;
    userProfile.name = userData.first_name;
  }
  const userProfileElement = document.getElementById('userProfile');
  userProfileElement.innerHTML = `
    <p><strong>Пользователь:</strong> ${userProfile.name}</p>
    <p><strong>ID:</strong> ${userProfile.id}</p>
  `;
}

// Загрузка документа
async function uploadDocument() {
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

  // Добавляем ID пользователя в заголовки
  const headers = {
    'user_id': userProfile.id,
    'first_name': userProfile.name,
  };

  // Отображаем сообщение о начале загрузки
  statusMessage.textContent = 'Загрузка файла...';
  statusMessage.style.color = 'blue';

  // Отправляем файл на сервер
  try {
    const response = await fetch(`${SERVER_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    console.log("uploadDocument: Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("uploadDocument: Error response data:", errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("uploadDocument: Success response data:", data);
    if (data.status === 'success') {
      // Обновляем список документов
      statusMessage.textContent = 'Документ успешно загружен!';
      statusMessage.style.color = 'green';
      updateDocumentList();
    } else {
      console.error("uploadDocument: Error from server:", data);
      throw new Error(data.message || 'Ошибка при загрузке документа');
    }
  } catch (error) {
    console.error('Ошибка при загрузке:', error);
    statusMessage.textContent = 'Не удалось загрузить документ. Проверьте сервер.';
    statusMessage.style.color = 'red';
  }
}

// Обновление списка документов
function updateDocumentList() {
  console.log("updateDocumentList: Updating document list")
  const documentList = document.getElementById('documentList');
  documentList.innerHTML = ''; // Очищаем список перед обновлением

  fetchDocuments()
    .then(files => {
      if (files && files.length > 0) {
        console.log("updateDocumentList: Files received from server:", files);
        files.forEach((doc, index) => {
          const listItem = document.createElement('div');
          listItem.className = 'document-item'; // Для стилей, если нужно
          let fileContent = `<p>${doc.file_name}</p>`;
          if (doc.file_type && doc.file_type.startsWith('image/')) {
            fileContent = `<img src="${doc.file_url}" alt="${doc.file_name}" class="document-preview">`;
          }

          listItem.innerHTML = `
            ${fileContent}
            <button onclick="openDocument('${doc.file_url}')">Открыть документ</button>
            <button onclick="showQrCode('${doc.file_url}')">Показать QR-код</button>
            <button onclick="sendDocument('${doc.file_name}')">Отправить документ</button>
          `;
          documentList.appendChild(listItem);
        });
      } else {
        console.log("updateDocumentList: No files found.");
      }
    })
    .catch(error => {
      console.error("updateDocumentList: Error:", error)
    })
}

// получение списка файлов пользователя
async function fetchDocuments() {
  console.log("fetchDocuments: Fetching documents from server");
  try {
    const response = await fetch(`${SERVER_URL}/get_user_files/${userProfile.id}`);
    console.log("fetchDocuments: Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("fetchDocuments: Error response data:", errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("fetchDocuments: Success response data:", data);
    if (data.status === 'success') {
      console.log("fetchDocuments: Returning files:", data.files);
      return data.files;
    } else {
      console.error("fetchDocuments: Error from server:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching user files:", error);
    return [];
  }
}

// Открытие документа
function openDocument(documentUrl) {
  if (documentUrl) {
    const modal = document.getElementById('documentModal');
    const iframe = document.getElementById('documentIframe');
    iframe.src = documentUrl;
    modal.style.display = 'flex';
  } else {
    alert('Документ не найден.');
  }
}

// Открытие QR-кода в модальном окне
function showQrCode(documentUrl) {
  if (documentUrl) {
    const modal = document.getElementById('qrModal');
    const qrImage = document.getElementById('qrImage');
    const qrCodeUrl = documentUrl.replace("/uploaded_documents/", "/qr_codes/") + ".png";
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
// Закрытие модального окна документа
function closeDocumentModal() {
  const modal = document.getElementById('documentModal');
  modal.style.display = 'none'; // Закрываем модальное окно
}

// Отправка документа другому пользователю
function sendDocument(documentName) {
  const receiverId = prompt("Введите ID получателя:");
  if (!receiverId) {
    alert("Получатель не указан.");
    return;
  }

  // Отправка запроса на сервер для передачи документа
  fetch(`${SERVER_URL}/send_document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_id: userProfile.id,
      receiver_id: receiverId,
      document_id: documentName,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        alert("Документ успешно отправлен!");
      } else {
        alert("Ошибка при отправке документа.");
      }
      updateReceivedDocumentList()
    })
    .catch(error => {
      console.error('Ошибка при отправке:', error);
      alert('Произошла ошибка при отправке документа.');
    });
}

// Обновление списка полученных документов
function updateReceivedDocumentList() {
  console.log("updateReceivedDocumentList: Updating received document list");
  const receivedDocumentList = document.getElementById('receivedDocumentList');
  receivedDocumentList.innerHTML = ''; // Очищаем список перед обновлением
  fetchReceivedDocuments()
    .then(received => {
      if (received && received.length > 0) {
        console.log("updateReceivedDocumentList: Documents received from server:", received);
        received.forEach((doc, index) => {
          const listItem = document.createElement('div');
          listItem.className = 'document-item';
          listItem.innerHTML = `
            <p>${doc.file_name}</p>
            <button onclick="signDocument(${index}, '${doc.document_id}')">Подписать</button>
            <button onclick="ignoreDocument(${index}, '${doc.document_id}')">Игнорировать</button>
          `;
          receivedDocumentList.appendChild(listItem);
        })
      } else {
        console.log("updateReceivedDocumentList: No received documents found.");
      }
    })
    .catch(error => {
      console.error("updateReceivedDocumentList: Error:", error);
    })
}

//получение списка документов
async function fetchReceivedDocuments() {
  console.log("fetchReceivedDocuments: Fetching received documents from server");
  try {
    const response = await fetch(`${SERVER_URL}/received_documents/${userProfile.id}`);
    console.log("fetchReceivedDocuments: Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("fetchReceivedDocuments: Error response data:", errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("fetchReceivedDocuments: Success response data:", data);
    if (data.status === 'success') {
      return data.documents;
    } else {
      console.error("fetchReceivedDocuments: Error from server:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching received documents:", error);
    return [];
  }
}

// Подписание документа
function signDocument(index, documentId) {
  console.log("signDocument: Signing document with ID", documentId);
  // Реализация подписания документа
  fetch(`${SERVER_URL}/sign_document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userProfile.id,
      document_id: documentId,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        alert("Документ подписан успешно.");
        updateReceivedDocumentList(); // Обновляем список полученных документов
      } else {
        alert("Ошибка при подписании документа.");
      }
    })
    .catch(error => {
      console.error("Error signing document:", error);
      alert("Ошибка при подписании документа.");
    });
}

// Игнорирование документа
function ignoreDocument(index, documentId) {
  console.log("ignoreDocument: Ignoring document with ID", documentId);
  // Реализация игнорирования документа
  fetch(`${SERVER_URL}/ignore_document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userProfile.id,
      document_id: documentId,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        alert("Документ проигнорирован.");
        updateReceivedDocumentList(); // Обновляем список полученных документов
      } else {
        alert("Ошибка при игнорировании документа.");
      }
    })
    .catch(error => {
      console.error("Error ignoring document:", error);
      alert("Ошибка при игнорировании документа.");
    });
}

// Инициализация при загрузке страницы
window.onload = function() {
  initializeUserProfile();
  updateDocumentList();
  updateReceivedDocumentList();
};
