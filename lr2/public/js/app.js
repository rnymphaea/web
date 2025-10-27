let currentBookId = null;

document.addEventListener('DOMContentLoaded', function() {
  const booksTable = document.getElementById('booksTable');
  if (booksTable) {
    loadBooks();
  }
});

async function loadBooks() {
  try {
    const availableFilter = document.getElementById('availableFilter');
    const overdueFilter = document.getElementById('overdueFilter');
    
    let url = '/api/books?';
    if (availableFilter && availableFilter.checked) url += 'available=true&';
    if (overdueFilter && overdueFilter.checked) url += 'overdue=true&';
    
    const response = await fetch(url);
    const books = await response.json();
    
    renderBooksTable(books);
  } catch (error) {
    console.error('Error loading books:', error);
    alert('Ошибка загрузки книг');
  }
}

function renderBooksTable(books) {
  const tbody = document.getElementById('booksTable');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  books.forEach(book => {
    const row = document.createElement('tr');
    
    const statusClass = book.available ? 'status-available' : 'status-borrowed';
    const statusText = book.available ? 'В наличии' : 'Выдана';
    
    let dueDateInfo = '';
    if (!book.available && book.dueDate) {
      const isOverdue = new Date(book.dueDate) < new Date();
      dueDateInfo = isOverdue ? ' (ПРОСРОЧЕНО)' : ` (до ${book.dueDate})`;
    }
    
    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td class="${statusClass}">${statusText}${dueDateInfo}</td>
      <td>
        <button onclick="location.href='/book/${book.id}'">
          <i class="fas fa-eye"></i> Просмотр
        </button>
        <button onclick="deleteBookFromList(${book.id})" class="danger">
          <i class="fas fa-trash"></i> Удалить
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function applyFilters() {
  loadBooks();
}

function showAddBookForm() {
  const form = document.getElementById('addBookForm');
  if (form) {
    form.style.display = 'block';
  }
}

function hideAddBookForm() {
  const form = document.getElementById('addBookForm');
  if (form) {
    form.style.display = 'none';
    const newBookForm = document.getElementById('newBookForm');
    if (newBookForm) {
      newBookForm.reset();
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const newBookForm = document.getElementById('newBookForm');
  if (newBookForm) {
    newBookForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const bookData = {
        title: formData.get('title'),
        author: formData.get('author'),
        year: parseInt(formData.get('year'))
      };
      
      try {
        const response = await fetch('/api/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
          hideAddBookForm();
          loadBooks();
          alert('Книга успешно добавлена');
        } else {
          alert('Ошибка добавления книги');
        }
      } catch (error) {
        console.error('Error adding book:', error);
        alert('Ошибка добавления книги');
      }
    });
  }
});

async function deleteBookFromList(bookId) {
  if (!confirm('Вы уверены, что хотите удалить эту книгу?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      loadBooks();
      alert('Книга успешно удалена');
    } else {
      alert('Ошибка удаления книги');
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    alert('Ошибка удаления книги');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const readerDialog = document.getElementById('readerDialog');
  if (readerDialog) {
    readerDialog.addEventListener('close', function() {
      if (this.returnValue === 'submit') {
        const readerName = document.getElementById('readerName').value;
        const dueDate = document.getElementById('dueDate').value;
        
        if (readerName && dueDate && currentBookId) {
          issueBook(currentBookId, readerName, dueDate);
        }
      }
      
      document.getElementById('readerName').value = '';
      document.getElementById('dueDate').value = '';
      currentBookId = null;
    });
  }
});

async function issueBook(bookId, readerName, dueDate) {
  try {
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        available: false,
        borrowedBy: readerName,
        dueDate: dueDate
      })
    });
    
    if (response.ok) {
      if (window.location.pathname.startsWith('/book/')) {
        location.reload();
      } else {
        loadBooks();
      }
    } else {
      alert('Ошибка выдачи книги');
    }
  } catch (error) {
    console.error('Error issuing book:', error);
    alert('Ошибка выдачи книги');
  }
}

function openReaderDialog(bookId) {
  currentBookId = bookId;
  const dialog = document.getElementById('readerDialog');
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dueDate').min = today;
  
  dialog.showModal();
}

function closeReaderDialog() {
  const dialog = document.getElementById('readerDialog');
  dialog.close();
  document.getElementById('readerName').value = '';
  document.getElementById('dueDate').value = '';
  currentBookId = null;
}

document.addEventListener('DOMContentLoaded', function() {
  const readerForm = document.getElementById('readerForm');
  if (readerForm) {
    readerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const readerName = document.getElementById('readerName').value;
      const dueDate = document.getElementById('dueDate').value;
      
      if (readerName && dueDate && currentBookId) {
        await issueBook(currentBookId, readerName, dueDate);
        closeReaderDialog();
      }
    });
  }
});
