require('dotenv').config(); // Import dotenv để đọc file .env
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000; // Lấy PORT từ .env hoặc dùng 4000 mặc định

// Kết nối với MongoDB qua URI trong .env
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Middleware
app.use(bodyParser.json());
app.use(cors());


// Khởi tạo Schema và Model cho sinh viên
const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: [true, 'Full name is required'] },
  studentCode: {
    type: String,
    required: [true, 'Student code is required'],
    unique: true,
    match: [/^ST\d{5}$/, 'Invalid student code format (e.g., ST12345)'],
  },
  isActive: { type: Boolean, default: true },
});

const Student = mongoose.model('Student', studentSchema);

// API R1: Trả về thông tin cá nhân
app.get('/info', (req, res) => {
  res.json({
    data: { fullName: 'Le Manh Hung', studentCode: 'QE170213' },
  });
});

// API R2: POST /students - Tạo sinh viên mới
app.post('/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
    } else if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Student code already exists',
      });
    } else {
      console.error('Server Error:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
      });
    }
  }
});

// API R3: GET /students - Lấy danh sách sinh viên
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server',
    });
  }
});

// API R4: GET /students/:id - Lấy thông tin sinh viên theo ID
app.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server',
    });
  }
});

// API R5: PUT /students/:id - Cập nhật thông tin sinh viên
app.put('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // Chạy lại validator trên dữ liệu mới
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error('Server Error:', error);
      res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
      });
    }
  }
});

// API R6: DELETE /students/:id - Xóa sinh viên
app.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server',
    });
  }
});

// Khởi động server
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
