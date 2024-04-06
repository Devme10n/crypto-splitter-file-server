const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 4000; // 서버 포트 번호

app.use(express.json()); // JSON 파싱을 위한 미들웨어 설정
app.use(express.urlencoded({ extended: true })); // URL 인코딩을 위한 미들웨어 설정
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(500).send(`Multer error: ${err.message}`);
  } else if (err) {
    res.status(500).send(`Unknown server error: ${err.message}`);
  }
});

// multer를 사용한 파일 저장소 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/') // 업로드된 파일이 저장될 서버 내 디렉토리
  },
  filename: function(req, file, cb) {
    // 파일명 설정. 여기서는 업로드된 파일의 원래 이름을 사용합니다.
    cb(null, file.originalname)
  }
});

const upload = multer({ storage: storage });

// 파일 업로드를 위한 라우트 설정. 'file'은 폼 데이터의 키 값이어야 합니다.
app.post('/upload', upload.single('file'), (req, res, next) => {
  res.status(200).send('File uploaded successfully');
  // 파일 업로드 처리
}, (err, req, res, next) => {
  // multer에서 발생한 오류 처리
  if (err instanceof multer.MulterError) {
    res.status(500).send('File upload failed');
  } else if (err) {
    res.status(500).send('An error occurred');
  }
});

app.post('/download', (req, res) => {
  // 클라이언트가 요청 본문에 보낸 파일 UUID를 받아옵니다.
  console.log('req.body:', req.body);
  const uuids = req.body.uuids;

  // 각 UUID에 대해 파일 다운로드를 시작합니다.
  uuids.forEach(uuid => {
    const filePath = path.join(__dirname, 'uploads', uuid);
    res.download(filePath, err => {
      if (err) {
        console.error(`File download failed: ${err}`);
        res.status(500).send('File download failed');
      } else {
        console.log('File downloaded successfully');
      }
    });
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// ##########################################################################################
// curl -F "file=@/Users/mac/Documents/split_file/dummyfile" http://localhost:3000/upload
// ##########################################################################################
