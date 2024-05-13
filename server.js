const express = require('express');
const multer = require('multer');
const path = require('path');
const fsp = require('fs').promises;
require('dotenv').config();

//=================================================================
// const dotenv_path = path.join(process.cwd(), './.env');
// const dotenv = require('dotenv').config({
//   path: dotenv_path
// });
// if (dotenv.error) throw dotenv.error;
//=================================================================

const app = express();
// const port = 8500; // 서버 포트 번호

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

/**
 * 임시 디렉토리 확인 및 생성
 * @description 주어진 경로에 폴더가 존재하지 않으면 생성. 이미 존재하는 경우, 내용을 비우고 다시 생성.
 * @param {...string} paths 생성하거나 확인할 임시 폴더 경로들
 */
async function ensureDirectories(...paths) {
  for (const tempPath of paths) {
    try {
      // 디렉토리 존재 여부 확인
      await fsp.access(tempPath);
      console.log(`디렉토리 존재함: ${tempPath}`);
      continue; // 디렉토리가 이미 존재하면 다음 경로로 이동

      // // 디렉토리가 존재하면 삭제
      // await fsp.rm(tempPath, { recursive: true });
      // console.log(`디렉토리 삭제됨: ${tempPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        // ENOENT 이외의 오류는 예상하지 못한 오류이므로, 로그를 남기고 예외를 다시 던짐
        console.error(`디렉토리 확인 중 오류 발생: ${error.message}`);
        throw error;
      }
    }
    try {
      // 임시 디렉토리 생성
      await fsp.mkdir(tempPath);
      console.log(`디렉토리 생성됨: ${tempPath}`);
    } catch (error) {
      console.error(`디렉토리 처리 중 오류 발생: ${error.message}`);
      throw error;
    }
  }
}

// 서버 시작 전에 임시 디렉토리 확인 및 생성
(async () => {
  try {
    await ensureDirectories('./uploads');
  } catch (error) {
    console.error(`폴더 생성 실패: ${error}`);
    process.exit(1);
  }
})();

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
app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});

// ##########################################################################################
// curl -F "file=@/Users/mac/Documents/split_file/dummyfile" http://localhost:3000/upload
// ##########################################################################################
