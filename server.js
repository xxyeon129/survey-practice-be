import express from 'express';
import multer, { diskStorage } from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();
const { EMAIL_SERVICE, AUTH_EMAIL, AUTH_PASSWORD, SERVER_URL, AUTH_TO_EMAIL } = process.env;

const app = express();
const port = 4444;

app.use(cors());

// 파일 저장 임시 디렉토리 설정
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 프론트로부터 받은 파일 저장
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// TEST CODE
app.get('/', (req, res) => {
  res.send('서버 가동 중~~~');
});

// POST API
app.post('/upload', upload.single('file'), (req, res) => {
  const uploadFile = req.file;
  console.log('업로드된 파일 정보 : ', uploadFile);

  // Email 전송
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    // service: EMAIL_SERVICE,
    auth: {
      user: AUTH_EMAIL,
      pass: AUTH_PASSWORD,
    },
  });

  const mailOptions = {
    from: AUTH_EMAIL,
    to: AUTH_TO_EMAIL,
    subject: 'Nodemailer SendAttachment Test',
    text: '노드메일러를 이용해 보낸 메일의 내용입니다.',
    attachments: [
      {
        filename: 'express-test-1.csv',
        path: `${uploadFile.destination}/${uploadFile.filename}`,
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email snet : ', info);
    }
  });

  res.status(200).send('파일 업로드 완료!');

  if (!uploadFile) {
    res.status(400).send('파일이 없음 오류');
    return;
  }
});

app.listen(port, () => {
  console.log(`~~서버가 ${port} 포트에서 실행 중~~`);
});
