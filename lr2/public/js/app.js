let currentBookId = null;

document.addEventListener('DOMContentLoaded', function() {
    const booksTable = document.getElementById('booksTable');
    if (booksTable) {
        loadBooks();
    }

    const newBookForm = document.getElementById('newBookForm');
    if (newBookForm) {
        newBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewBook(this);
        });
    }

    const readerForm = document.getElementById('readerForm');
    if (readerForm) {
        readerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookIssue();
        });
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
        if (!response.ok) throw new Error('Network error');
        
        const books = await response.json();
        renderBooksTable(books);
    } catch (error) {
        console.error('Error:', error);
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
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applyFilters() {
    loadBooks();
}

function showAddBookForm() {
    const form = document.getElementById('addBookForm');
    if (form) form.style.display = 'block';
}

function hideAddBookForm() {
    const form = document.getElementById('addBookForm');
    if (form) {
        form.style.display = 'none';
        document.getElementById('newBookForm').reset();
    }
}

async function addNewBook(form) {
    const formData = new FormData(form);
    const bookData = {
        title: formData.get('title'),
        author: formData.get('author'),
        year: parseInt(formData.get('year'))
    };
    
    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        if (!response.ok) throw new Error('Add failed');
        
        hideAddBookForm();
        loadBooks();
        alert('Книга добавлена');
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка добавления книги');
    }
}

async function deleteBookFromList(bookId) {
    if (!confirm('Удалить эту книгу?')) return;
    
    try {
        const response = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        
        loadBooks();
        alert('Книга удалена');
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка удаления');
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
    document.getElementById('readerDialog').close();
    document.getElementById('readerName').value = '';
    document.getElementById('dueDate').value = '';
    currentBookId = null;
}

async function handleBookIssue() {
    const readerName = document.getElementById('readerName').value;
    const dueDate = document.getElementById('dueDate').value;
    
    if (!readerName || !dueDate || !currentBookId) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`/api/books/${currentBookId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                available: false,
                borrowedBy: readerName,
                dueDate: dueDate
            })
        });
        
        if (!response.ok) throw new Error('Issue failed');
        
        closeReaderDialog();
        if (window.location.pathname.startsWith('/book/')) {
            location.reload();
        } else {
            loadBooks();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка выдачи книги');
    }
}

async function issueBook(bookId, readerName, dueDate) {
    currentBookId = bookId;
    await handleBookIssue();
}
