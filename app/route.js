// app/api/mpd/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mpdUrl = searchParams.get('url');

  if (!mpdUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(mpdUrl);
    if (!res.ok) throw new Error(`Failed to fetch MPD: ${res.status}`);

    const xml = await res.text();

    const injectedRep = `      <Representation bandwidth="3000000" height="1080" width="1920" codecs="avc1.640028" frameRate="25" id="1080p-injected" />\n`;

    const updatedXml = xml.replace(
      /(<AdaptationSet[^>]*contentType="video"[\s\S]*?<SegmentTemplate[\s\S]*?>)(\s*<Representation[^>]*>)/,
      `$1\n${injectedRep}$2`
    );

    return new NextResponse(updatedXml, {
      headers: {
        'Content-Type': 'application/dash+xml',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
