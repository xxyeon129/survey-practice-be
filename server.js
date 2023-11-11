import express from 'express';
import multer, { diskStorage } from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();
const { AUTH_EMAIL, AUTH_PASSWORD, AUTH_TO_EMAIL, CLIENT_URL } = process.env;

const app = express();
const port = 4444;

const corsOptions = {
  origin: ['http://localhost:3000', CLIENT_URL],
  optionSuccessStatus: 200,
};

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
app.post(
  '/upload',
  cors(corsOptions),
  upload.fields([{ name: 'file' }, { name: 'name' }, { name: 'birthday' }]),
  (req, res) => {
    const uploadFile = req.files['file'][0];
    console.log('업로드된 파일 정보 : ', uploadFile);
    const name = req.body['name'];
    const birthday = req.body['birthday'];
    const personalInfo = {
      name,
      birthday,
    };

    // Email 전송
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: AUTH_EMAIL,
        pass: AUTH_PASSWORD,
      },
    });

    const mailOptions = {
      from: AUTH_EMAIL,
      to: AUTH_TO_EMAIL,
      subject: `[이상운동질환 비운동증상 전자설문 임시저장 Excel 파일] ${personalInfo.name}환자`,
      text: `생년월일 ${personalInfo.birthday}, ${personalInfo.name} 환자의 이상운동질환 비운동증상 전자설문 임시저장 Excel 파일입니다.`,
      attachments: [
        {
          filename: `이상운동질환 비운동증상 전자설문_${personalInfo.name}_${personalInfo.birthday}.xlsx`,
          path: `${uploadFile.destination}/${uploadFile.filename}`,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent : ', info);

        // 임시 저장 파일 삭제
        const filePath = uploadFile.path;

        fs.unlink(filePath, (err) => {
          if (err) console.error('파일 삭제 실패: ', err);
          else console.log('파일 삭제 성공');
        });
      }
    });

    res.status(200).send('파일 업로드 완료!');

    if (!uploadFile) {
      res.status(400).send('파일이 없음 오류');
      return;
    }
  }
);

app.listen(port, () => {
  console.log(`~~서버가 ${port} 포트에서 실행 중~~`);
});
