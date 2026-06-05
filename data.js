// ============================================================
//  /api/data?year=2026
//  기존 Google Apps Script 웹앱을 그대로 데이터 소스로 사용.
//  서버 사이드에서 호출하므로 CORS / 리다이렉트 문제가 없습니다.
//
//  배포 전 설정:
//   - Vercel 프로젝트 > Settings > Environment Variables 에
//     GAS_URL = (Apps Script 웹앱 배포 URL, /exec 로 끝남)
//     을 등록하면 아래 기본값 대신 그 값을 사용합니다.
//   - 등록하지 않으면 아래 DEFAULT_GAS_URL 을 사용합니다.
// ============================================================

const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbxSjZrUteeooZBjK1vTKtDTQkm6gFqYeUUp3ajGQc4Vpk-Pqw7y9wwYHogHS50_M_KW/exec';

module.exports = async (req, res) => {
  const GAS_URL = process.env.GAS_URL || DEFAULT_GAS_URL;
  const year = (req.query && req.query.year ? String(req.query.year) : '2026');

  try {
    const url = `${GAS_URL}?action=getData&year=${encodeURIComponent(year)}`;
    const r = await fetch(url, { redirect: 'follow' });

    if (!r.ok) {
      res.status(502).json({ error: `Apps Script 응답 오류 (HTTP ${r.status})` });
      return;
    }

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // Apps Script가 JSON 대신 HTML(로그인/오류 페이지 등)을 반환한 경우
      res.status(502).json({
        error:
          'Apps Script가 JSON을 반환하지 않았습니다. 웹앱 접근 권한이 "모든 사용자"인지, /exec URL이 맞는지 확인하세요.',
      });
      return;
    }

    // 60초 동안 CDN 캐시 → 시트 갱신 반영은 최대 1분 지연 (트래픽/호출 절약)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : String(e) });
  }
};
