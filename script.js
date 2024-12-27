 // Telegram Web Apps Initialization
 Telegram.WebApp.ready();

 // Массив для хранения загруженных и полученных документов
 const uploadedDocuments = [];
 const receivedDocuments = [];

 // URL сервера
 const SERVER_URL = 'https://c37b-95-24-20-127.ngrok-free.app'; // Замените на URL вашего сервера

 // Профиль пользователя
 let userProfile = {
   id: 'guest',
   name: 'Гость',
 };

 // Инициализация данных пользователя
 async function initializeUserProfile() {
  console.log("initializeUserProfile: start");
  const userData = Telegram.WebApp.initDataUnsafe?.user;
   if (userData) {
       userProfile.id = userData.id;
       userProfile.name = userData.first_name;
        const added = await addUser(userProfile.id)
        if (added) {
             console.log('User added:', userProfile.id);
             await getFiles() // получаем файлы после добавления пользователя.
         }
    }
  const userProfileElement = document.getElementById('userProfile');
  userProfileElement.innerHTML = `
      <p><strong>Пользователь:</strong> ${userProfile.name}</p>
      <p><strong>ID:</strong> ${userProfile.id}</p>
  `;
   console.log("initializeUserProfile: end");
}
 async function addUser(userId) {
  const response = await fetch(`${SERVER_URL}/api/add_user`, {
      method: 'POST',
      headers: {
       'Content-Type': 'application/json',
       },
       body: JSON.stringify({ user_id: userId }),
      });
      if (response.ok) {
        return true;
      }
    return false;
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
    try{
      const response = await fetch(`${SERVER_URL}/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });
        if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
         if (data.status === 'success') {
               // Обновляем список документов
               await getFiles()
               statusMessage.textContent = 'Документ успешно загружен!';
               statusMessage.style.color = 'green';
        } else {
         throw new Error(data.message || 'Ошибка при загрузке документа');
         }
    }catch (error) {
        console.error('Ошибка при загрузке:', error);
        statusMessage.textContent = 'Не удалось загрузить документ. Проверьте сервер.';
        statusMessage.style.color = 'red';
    };

}
 // Получение файлов
async function getFiles(){
    const uploadedList =  await getUploadedFiles();
    const receivedList =  await getReceivedFiles();
     if (uploadedList) {
        uploadedDocuments.length = 0
        uploadedList.forEach((file) => {
               uploadedDocuments.push({
                    name: file.file_name,
                    url: `${SERVER_URL}${file.file_url}`,
                    qrCodeUrl: `${SERVER_URL}${file.qr_code_url}`,
               })
             })
        updateDocumentList();
        }
     if (receivedList){
         receivedDocuments.length = 0
         receivedList.forEach((file) => {
              receivedDocuments.push({
               name: file.document_id,
               sender_id: file.sender_id,
               id: file.id
               })
         })
         updateReceivedDocumentList();
     }
}
 // получение списка загруженных файлов
 async function getUploadedFiles(){
  console.log("getUploadedFiles: start")
 const response =  await fetch(`${SERVER_URL}/api/get_files/${userProfile.id}`)
  console.log("getUploadedFiles: response", response)
  if (response.ok){
       const data = await response.json()
       console.log("getUploadedFiles: data", data)
     return data.files;
 }
 return null
}

// получение списка полученных файлов
async function getReceivedFiles(){
  console.log("getReceivedFiles: start")
  const response =  await fetch(`${SERVER_URL}/received_documents/${userProfile.id}`)
  console.log("getReceivedFiles: response", response)
 if (response.ok){
       const data = await response.json();
      console.log("getReceivedFiles: data", data)
       return data.documents;
 }
 return null
}


 // Обновление списка документов
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
      <button onclick="sendDocument(${index})">Отправить документ</button>
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

// Отправка документа другому пользователю
 async function sendDocument(index) {
    const receiverId = prompt("Введите ID получателя:");
     if (!receiverId) {
         alert("Получатель не указан.");
         return;
     }

    const documentId = uploadedDocuments[index].name;

      try{
          const response = await fetch(`${SERVER_URL}/send_document`, {
              method: 'POST',
                headers: {
                'Content-Type': 'application/json',
               },
             body: JSON.stringify({
               sender_id: userProfile.id,
               receiver_id: receiverId,
               document_id: documentId,
             }),
         });
       const data = await response.json();
        if (data.status === 'success') {
           alert("Документ успешно отправлен!");
         } else {
           alert("Ошибка при отправке документа.");
        }
    }catch(error){
        console.error('Ошибка при отправке:', error);
       alert('Произошла ошибка при отправке документа.');
    }
 }

  // Обновление списка полученных документов
   function updateReceivedDocumentList() {
     const receivedDocumentList = document.getElementById('receivedDocumentList');
     receivedDocumentList.innerHTML = ''; // Очищаем список перед обновлением
     receivedDocuments.forEach((doc, index) => {
       const listItem = document.createElement('div');
      listItem.className = 'document-item';
     listItem.innerHTML = `
          <p>${doc.name}</p>
           <button onclick="signDocument(${index})">Подписать</button>
          <button onclick="ignoreDocument(${index})">Игнорировать</button>
       `;
      receivedDocumentList.appendChild(listItem);
  });
 }

// Подписать документ
async function signDocument(index) {
const doc = receivedDocuments[index];
try{
   const response = await fetch(`${SERVER_URL}/process_document`, {
        method: 'POST',
         headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
         user_id: userProfile.id,
         document_id: doc.name,
         action: 'sign'
       }),
  });
  const data = await response.json();
 if (data.status === 'success') {
       await getFiles();
     alert("Документ подписан и добавлен в мои документы.");
    }
}catch(error){
     console.error('Ошибка при подписании:', error);
      alert('Произошла ошибка при подписании документа.');
}

}

// Игнорировать документ
async function ignoreDocument(index) {
    const doc = receivedDocuments[index];
    try{
      const response = await fetch(`${SERVER_URL}/process_document`, {
          method: 'POST',
           headers: {
             'Content-Type': 'application/json',
          },
          body: JSON.stringify({
             user_id: userProfile.id,
              document_id: doc.name,
              action: 'ignore'
         }),
       });
        const data = await response.json();
       if (data.status === 'success') {
        await getFiles();
         alert("Документ проигнорирован.");
       }
     }catch(error){
           console.error('Ошибка при игнорировании:', error);
        alert('Произошла ошибка при игнорировании документа.');
    }

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
  initializeUserProfile(); // Инициализируем данные пользователя
  document.querySelector('.tab-button').click();
 });