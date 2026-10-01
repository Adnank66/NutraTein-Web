const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(resData); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: resData, json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting PROTEINX Admin Enhancement Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.statusCode === 200 && health.json && health.json.success, 'API Health Check (/api/health)');

    // 2. Admin Login
    const login = await request('POST', '/api/auth/login', {
      email: 'admin@proteinx.in',
      password: 'Admin@123'
    });
    assert(login.statusCode === 200 && login.json && login.json.token, 'Admin Login Returns JWT Token');
    const token = login.json ? login.json.token : '';
    const adminHeaders = { 'Authorization': `Bearer ${token}` };

    assert(login.json && login.json.user && login.json.user.adminRole === 'super_admin', 'Admin Login Returns adminRole: super_admin');

    // 3. Admin user list
    const users = await request('GET', '/api/auth/users', null, adminHeaders);
    assert(users.statusCode === 200 && users.json && Array.isArray(users.json.users), 'Admin Customer List (/api/auth/users)');

    // 4. Export Customers CSV
    const custCsv = await request('GET', '/api/auth/users/export', null, adminHeaders);
    assert(custCsv.statusCode === 200 && custCsv.headers['content-type'].includes('text/csv'), 'Export Customers to CSV (/api/auth/users/export)');

    // 5. Customer Order History
    const demoUser = users.json.users.find(u => u.email === 'john@example.com') || users.json.users[0];
    if (demoUser) {
      const userOrders = await request('GET', `/api/auth/users/${demoUser._id}/orders`, null, adminHeaders);
      assert(userOrders.statusCode === 200 && Array.isArray(userOrders.json.orders), 'Customer Order History (/api/auth/users/:id/orders)');
    }

    // 6. Admin Roles Management (Super Admin)
    const admins = await request('GET', '/api/auth/admins', null, adminHeaders);
    assert(admins.statusCode === 200 && Array.isArray(admins.json.admins), 'Super Admin List Admins & Roles (/api/auth/admins)');

    // 7. Orders Export CSV
    const ordersCsv = await request('GET', '/api/orders/export/csv', null, adminHeaders);
    assert(ordersCsv.statusCode === 200 && ordersCsv.headers['content-type'].includes('text/csv'), 'Export Orders to CSV (/api/orders/export/csv)');

    // 8. Reviews Route (MockDB support)
    const reviews = await request('GET', '/api/reviews/admin', null, adminHeaders);
    assert(reviews.statusCode === 200 && Array.isArray(reviews.json.reviews), 'Reviews Admin List with MockDB (/api/reviews/admin)');

    // 9. Banners CRUD
    const banners = await request('GET', '/api/banners/admin', null, adminHeaders);
    assert(banners.statusCode === 200 && Array.isArray(banners.json.banners), 'Banners Admin List (/api/banners/admin)');

    // Create a banner
    const newBanner = await request('POST', '/api/banners', {
      title: 'Test Promo Banner',
      subtitle: 'Testing Suite Created',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
      link: 'shop.html',
      cta: 'Explore'
    }, adminHeaders);
    assert(newBanner.statusCode === 201 && newBanner.json && newBanner.json.banner, 'Banner Creation (/api/banners)');
    const bannerId = newBanner.json && newBanner.json.banner ? newBanner.json.banner._id : null;

    // Delete test banner
    if (bannerId) {
      const delBanner = await request('DELETE', `/api/banners/${bannerId}`, null, adminHeaders);
      assert(delBanner.statusCode === 200, 'Banner Deletion (/api/banners/:id)');
    }

    // 10. Email Settings & Templates
    const emailSettings = await request('GET', '/api/email/settings', null, adminHeaders);
    assert(emailSettings.statusCode === 200 && emailSettings.json && emailSettings.json.settings, 'Email Settings API (/api/email/settings)');

    const emailTemplates = await request('GET', '/api/email/templates', null, adminHeaders);
    assert(emailTemplates.statusCode === 200 && emailTemplates.json && emailTemplates.json.templates, 'Email Templates API (/api/email/templates)');

    const emailLogs = await request('GET', '/api/email/logs', null, adminHeaders);
    assert(emailLogs.statusCode === 200 && Array.isArray(emailLogs.json.logs), 'Email Logs API (/api/email/logs)');

    // 11. CMS Public & Admin
    const cmsAbout = await request('GET', '/api/cms/about');
    assert(cmsAbout.statusCode === 200 && cmsAbout.json && cmsAbout.json.page, 'Public CMS About API (/api/cms/about)');

    const cmsContact = await request('GET', '/api/cms/contact');
    assert(cmsContact.statusCode === 200 && cmsContact.json && cmsContact.json.page, 'Public CMS Contact API (/api/cms/contact)');

    // 12. Settings with WhatsApp Enabled
    const settings = await request('GET', '/api/settings');
    assert(settings.statusCode === 200 && settings.json && settings.json.settings && settings.json.settings.whatsappEnabled !== undefined, 'Settings API with whatsappEnabled flag (/api/settings)');

    // 13. Media Manager
    const media = await request('GET', '/api/media', null, adminHeaders);
    assert(media.statusCode === 200 && Array.isArray(media.json.files), 'Media Manager Listing (/api/media)');

    // 14. Activity Logs CSV
    const logsCsv = await request('GET', '/api/activity-logs/export/csv', null, adminHeaders);
    assert(logsCsv.statusCode === 200 && logsCsv.headers['content-type'].includes('text/csv'), 'Activity Logs Export to CSV (/api/activity-logs/export/csv)');

    // 15. Backup Export (Super Admin)
    const backup = await request('GET', '/api/backup/export', null, adminHeaders);
    assert(backup.statusCode === 200 && backup.json && backup.json.data, 'Super Admin Backup Export (/api/backup/export)');

    // 16. Dashboard Summary Cards
    const dashboard = await request('GET', '/api/analytics/dashboard', null, adminHeaders);
    assert(
      dashboard.statusCode === 200 &&
      dashboard.json &&
      dashboard.json.stats &&
      dashboard.json.stats.pendingReviews !== undefined &&
      dashboard.json.stats.lowStockCount !== undefined &&
      dashboard.json.stats.emailsSentToday !== undefined,
      'Dashboard Enhanced Analytics Stats (/api/analytics/dashboard)'
    );

    // 17. Public Videos API
    const pubVideos = await request('GET', '/api/videos');
    assert(
      pubVideos.statusCode === 200 &&
      pubVideos.json &&
      pubVideos.json.success &&
      pubVideos.json.heroVideo !== undefined &&
      Array.isArray(pubVideos.json.fitnessVideos),
      'Public Videos API (/api/videos)'
    );

    // 18. Admin Videos API
    const adminVideos = await request('GET', '/api/videos/admin', null, adminHeaders);
    assert(
      adminVideos.statusCode === 200 &&
      adminVideos.json &&
      adminVideos.json.heroVideo &&
      Array.isArray(adminVideos.json.fitnessVideos),
      'Admin Videos Management API (/api/videos/admin)'
    );

    // 19. Admin Hero Video Update
    const updateHero = await request('PUT', '/api/videos/hero', {
      title: 'TEST HERO TITLE VERIFICATION'
    }, adminHeaders);
    assert(
      updateHero.statusCode === 200 &&
      updateHero.json &&
      updateHero.json.heroVideo &&
      updateHero.json.heroVideo.title === 'TEST HERO TITLE VERIFICATION',
      'Admin Hero Video Update (/api/videos/hero)'
    );

    // 20. Admin Fitness Showcase Video CRUD
    const addFitness = await request('POST', '/api/videos/fitness', {
      title: 'Test Showcase Clip',
      tag: 'TEST TAG',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-dumbbells-in-a-gym-44143-large.mp4',
      duration: '0:20'
    }, adminHeaders);
    assert(
      addFitness.statusCode === 201 &&
      addFitness.json &&
      addFitness.json.video &&
      addFitness.json.video.id,
      'Admin Fitness Video Creation (/api/videos/fitness)'
    );

    const fitId = addFitness.json && addFitness.json.video ? addFitness.json.video.id : null;
    if (fitId) {
      const delFit = await request('DELETE', `/api/videos/fitness/${fitId}`, null, adminHeaders);
      assert(delFit.statusCode === 200, 'Admin Fitness Video Deletion (/api/videos/fitness/:id)');
    }

    // 21. Live/Sandbox Email Test Console API
    const testEmail = await request('POST', '/api/email/test', {
      to: 'tester@proteinx.in',
      templateName: 'order_placed',
      note: 'Automated verification test'
    }, adminHeaders);
    assert(
      testEmail.statusCode === 200 &&
      testEmail.json &&
      testEmail.json.success === true,
      'Interactive Email Test Console API (/api/email/test)'
    );

    // 22. 3D Spinning Protein Tub Showcase Public API
    const getVideos = await request('GET', '/api/videos');
    assert(
      getVideos.statusCode === 200 &&
      getVideos.json &&
      getVideos.json.productShowcaseVideo &&
      getVideos.json.productShowcaseVideo.videoUrl === '/assets/videos/Protein_tub_spinning_video.mp4',
      '3D Spinning Tub Public API (/api/videos)'
    );

    // 23. Admin 3D Spinning Tub Showcase Update API
    const updateShowcase = await request('PUT', '/api/videos/product-showcase', {
      badgeText: '360° VERIFIED 3D VIEW',
      proteinGrams: '28g'
    }, adminHeaders);
    assert(
      updateShowcase.statusCode === 200 &&
      updateShowcase.json &&
      updateShowcase.json.productShowcaseVideo &&
      updateShowcase.json.productShowcaseVideo.badgeText === '360° VERIFIED 3D VIEW' &&
      updateShowcase.json.productShowcaseVideo.proteinGrams === '28g',
      'Admin 3D Product Showcase Update (/api/videos/product-showcase)'
    );

    console.log(`\n========================================`);
    console.log(`🏁 TESTS COMPLETED: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error (is server running?):', err.message);
    process.exit(1);
  }
}

runTests();
