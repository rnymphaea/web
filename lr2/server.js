const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'books.json');

// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper functions
async function readBooks() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeBooks(books) {
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));
}

// Routes
app.get('/', async (req, res) => {
  try {
    const books = await readBooks();
    res.render('index', { books });
  } catch (error) {
    console.error('Error loading books:', error);
    res.status(500).send('Error loading books');
  }
});

app.get('/book/:id', async (req, res) => {
  try {
    const books = await readBooks();
    const bookId = parseInt(req.params.id);
    const book = books.find(b => b.id === bookId);
    
    if (!book) {
      return res.status(404).send('Book not found');
    }
    
    res.render('book', { book });
  } catch (error) {
    console.error('Error loading book:', error);
    res.status(500).send('Error loading book');
  }
});

// REST API
app.get('/api/books', async (req, res) => {
  try {
    let books = await readBooks();
    
    // Filtering
    if (req.query.available === 'true') {
      books = books.filter(book => book.available);
    }
    if (req.query.overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      books = books.filter(book => !book.available && book.dueDate && book.dueDate < today);
    }
    
    res.json(books);
  } catch (error) {
    console.error('Error reading books:', error);
    res.status(500).json({ error: 'Error reading books' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const books = await readBooks();
    const newBook = {
      id: Math.max(...books.map(b => b.id), 0) + 1,
      title: req.body.title,
      author: req.body.author,
      year: parseInt(req.body.year),
      available: true,
      borrowedBy: '',
      dueDate: ''
    };
    
    books.push(newBook);
    await writeBooks(books);
    res.json(newBook);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Error adding book' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const books = await readBooks();
    const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    books[bookIndex] = { ...books[bookIndex], ...req.body };
    await writeBooks(books);
    res.json(books[bookIndex]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Error updating book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const books = await readBooks();
    const bookId = parseInt(req.params.id);
    const filteredBooks = books.filter(b => b.id !== bookId);
    
    if (filteredBooks.length === books.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    await writeBooks(filteredBooks);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Error deleting book' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
