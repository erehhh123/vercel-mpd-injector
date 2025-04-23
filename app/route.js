import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mpdUrl = searchParams.get('url');

  if (!mpdUrl) {
    return new NextResponse('Missing MPD URL', { status: 400 });
  }

  try {
    const response = await fetch(mpdUrl);
    let mpdText = await response.text();

    const injected1080p = `
      <Representation bandwidth=\"2500000\" height=\"1080\" width=\"1920\"
        codecs=\"avc1.640032\" frameRate=\"25000/1000\" id=\"inject-1080p\" />
    `;

    // Inject into video AdaptationSet
    mpdText = mpdText.replace(
      /(<AdaptationSet[^>]+contentType=\"video\"[^>]*>[\s\S]*?)(<\/AdaptationSet>)/,
      (match, start, end) => `${start}${injected1080p}${end}`
    );

    return new NextResponse(mpdText, {
      status: 200,
      headers: {
        'Content-Type': 'application/dash+xml'
      },
    });
  } catch (err) {
    return new NextResponse('Error fetching or modifying MPD', { status: 500 });
  }
}
