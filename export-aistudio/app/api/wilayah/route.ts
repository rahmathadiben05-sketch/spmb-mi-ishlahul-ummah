import { NextRequest, NextResponse } from 'next/server';

// Server-side cache for fast responses
const serverCache: Record<string, any> = {};

const API_ENDPOINTS = [
  'https://cdn.jsdelivr.net/gh/emsifa/api-wilayah-indonesia@main/api',
  'https://emsifa.github.io/api-wilayah-indonesia/api',
  'https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/main/api',
];

async function fetchExternal(path: string) {
  for (const base of API_ENDPOINTS) {
    try {
      const url = `${base}/${path}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      // try next mirror
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const provinceId = searchParams.get('provinceId');
  const regencyId = searchParams.get('regencyId');
  const districtId = searchParams.get('districtId');

  const cacheKey = `${type}_${provinceId || ''}_${regencyId || ''}_${districtId || ''}`;

  if (serverCache[cacheKey]) {
    return NextResponse.json(serverCache[cacheKey]);
  }

  try {
    let result: any = null;

    if (type === 'provinces') {
      result = await fetchExternal('provinces.json');
    } else if (type === 'regencies' && provinceId) {
      result = await fetchExternal(`regencies/${provinceId}.json`);
    } else if (type === 'districts' && regencyId) {
      result = await fetchExternal(`districts/${regencyId}.json`);
    } else if (type === 'villages' && districtId) {
      result = await fetchExternal(`villages/${districtId}.json`);
    }

    if (result && Array.isArray(result) && result.length > 0) {
      serverCache[cacheKey] = result;
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
      });
    }

    return NextResponse.json({ error: 'Data not found', fallback: true }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
