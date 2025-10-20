// Vercel 서버리스 기본 핸들러 (CommonJS)
module.exports = (req, res) => {
  res.status(200).send('✅ GPTube MVP 서버가 정상 작동 중입니다!');
};
