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
              await  updateDocumentList()


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
async function updateDocumentList() {
    console.log("updateDocumentList: Updating document list")
     const documentList = document.getElementById('documentList');
     documentList.innerHTML = ''; // Очищаем список перед обновлением
      try {
          const files = await fetchDocuments()
          if (files && files.length > 0) {
            console.log("updateDocumentList: Files received from server:", files);
              files.forEach((doc, index) => {
                const listItem = document.createElement('div');
                listItem.className = 'document-item'; // Для стилей, если нужно
                listItem.innerHTML = `
                     <p>${doc.file_name}</p>
                     <button onclick="openDocument('${doc.file_url}')">Открыть документ</button>
                     <button onclick="showQrCode('${doc.file_url}')">Показать QR-код</button>
                     <button onclick="sendDocument('${doc.file_name}')">Отправить документ</button>
                `;
                 documentList.appendChild(listItem);
               });
         } else {
             console.log("updateDocumentList: No files found.");
         }
      } catch (error) {
           console.error("updateDocumentList: Error updating:", error)
      }
}

// получение списка файлов пользователя
async function fetchDocuments(){
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
      return data.files
    } else {
        console.error("fetchDocuments: Error from server:", data);
      return [];
    }

  } catch (error) {
    console.error("Error fetching user files:", error);
  }
    return [];
}


// Открытие документа
function openDocument(documentUrl) {
  if (documentUrl) {
    window.open(documentUrl, '_blank');
  } else {
    alert('Документ не найден.');
  }
}

// Открытие QR-кода в модальном окне
function showQrCode(documentUrl) {
  if (documentUrl) {
    const modal = document.getElementById('qrModal');
    const qrImage = document.getElementById('qrImage');
      const qrCodeUrl = documentUrl.replace("/uploaded_documents/","/qr_codes/") + ".png";
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
  async function updateReceivedDocumentList() {
       console.log("updateReceivedDocumentList: Updating received document list");
      const receivedDocumentList = document.getElementById('receivedDocumentList');
      receivedDocumentList.innerHTML = ''; // Очищаем список перед обновлением
     try {
       const received =  await fetchReceivedDocuments()
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
      } catch (error) {
           console.error("updateReceivedDocumentList: Error updating:", error);
      }


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
           console.log("fetchReceivedDocuments: Returning documents:", data.documents);
          return data.documents
      } else {
           console.error("fetchReceivedDocuments: Error from server:", data);
          return [];
      }
  } catch (error) {
       console.error("Error fetching received documents:", error);
      return []
  }
}

// Подписать документ
  async function signDocument(index, documentId) {
      console.log("signDocument: Processing sign document request.");
       // Отправка запроса на сервер для обработки документа
        try {
           const response = await fetch(`${SERVER_URL}/process_document`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  user_id: userProfile.id,
                  document_id: documentId,
                  action: "sign"
                  }),
           });
           console.log("signDocument: Response status:", response.status);
           const data = await response.json();
            console.log("signDocument: Response data:", data);
           if (data.status === 'success') {
                alert("Документ подписан и добавлен в мои документы.");
                await updateReceivedDocumentList();
                await updateDocumentList()
            } else {
                console.error("signDocument: Error from server:", data);
                 alert("Ошибка при подписании документа.");
              }
           } catch (error) {
             console.error('Ошибка при обработке:', error);
              alert('Произошла ошибка при подписании документа.');
           }


}

// Игнорировать документ
function ignoreDocument(index, documentId) {
     console.log("ignoreDocument: Processing ignore document request.");
     // Отправка запроса на сервер для обработки документа
      fetch(`${SERVER_URL}/process_document`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
           body: JSON.stringify({
              user_id: userProfile.id,
              document_id: documentId,
              action: "ignore"
           }),
      })
          .then(response => response.json())
          .then(data => {
               console.log("ignoreDocument: Response data:", data);
              if (data.status === 'success') {
                 alert("Документ проигнорирован.");
                 updateReceivedDocumentList();
              } else {
                    console.error("ignoreDocument: Error from server:", data);
                  alert("Ошибка при игнорировании документа.");
              }
          })
        .catch(error => {
              console.error('Ошибка при обработке:', error);
              alert('Произошла ошибка при игнорировании документа.');
         });
}

async function openTab(evt, tabId) {
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

 if (tabId === 'myDocsTab'){
     console.log("openTab: Opening 'myDocsTab'");
     await  updateDocumentList()
  }
 if (tabId === 'receivedDocsTab'){
      console.log("openTab: Opening 'receivedDocsTab'");
        await updateReceivedDocumentList()
  }

}
// Открыть первую вкладку по умолчанию
 document.addEventListener('DOMContentLoaded', async () => {
      console.log("DOMContentLoaded: Initializing app");
      initializeUserProfile();
      document.querySelector('.tab-button').click();
       console.log("DOMContentLoaded: Getting user files");
      await updateDocumentList();
       console.log("DOMContentLoaded: App initialization completed.");
});