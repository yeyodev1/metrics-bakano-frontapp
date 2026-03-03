const fs = require('fs');
(async () => {
  try {
    const pageToken = 'EAAU0hWO1pU0BQ0YMjtL2wjMtT11H0MX917gE5nAnZCl2PwZCbcQrTKWRRvBiDGc0q13JD4lJOv0hSRnbfWtEEtIAnLwmWNytlBwMdB6uW0gImSuk3NsbJApDZByYQZAmZAGR7QPrlqTZAdssdqcypFlkJ62QgJZAncDnZAIEIfSZCQ0feoSTG8Gn7HkzZCF8R8m8rMe9vJDxUZD';
    const pageId = '111339880337090'; // Nicole Pastry Arts

    const res = await fetch(`https://graph.facebook.com/v22.0/${pageId}?access_token=${pageToken}&fields=instagram_business_account`);
    const data = await res.json();

    const output = { facebookPage: data };

    if (data.instagram_business_account) {
      const igId = data.instagram_business_account.id;
      const igRes = await fetch(`https://graph.facebook.com/v22.0/${igId}?access_token=${pageToken}&fields=followers_count,media_count,username,profile_picture_url`);
      const igData = await igRes.json();
      output.instagramAccount = igData;
    }

    fs.writeFileSync('_ig_debug.json', JSON.stringify(output, null, 2));

  } catch (e) {
    fs.writeFileSync('_ig_debug.json', JSON.stringify({ error: e.message }));
  }
})()
