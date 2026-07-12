const sequelize = require('../config/db');
const Equipment = require('../models/Equipment');

const appendUnique = (existing = [], additions = []) => {
  const rows = Array.isArray(existing) ? existing : [];
  const seen = new Set();
  return [...rows, ...additions]
    .map((item) => {
      if (typeof item === 'string') return { title: 'Learning resource', url: item };
      return item || {};
    })
    .filter((item) => item.url)
    .filter((item) => {
      const key = String(item.url).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const commonGallery = {
  microscope: [
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
  ],
  computing: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  ],
  networking: [
    'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  ],
};

const profiles = {
  microscope: {
    image: commonGallery.microscope[0],
    description: 'Compound laboratory microscope for observing prepared slides, biological samples, and fine material structures. Students should learn focusing, objective selection, illumination control, cleaning, and safe handling before use.',
    manualUrl: 'https://www.dcl.org/shared-assets/docs/hosted/microscope-manual.pdf',
    safetyManualUrl: 'https://www.microscope.com/support/manuals/omano/OM118-M%20Series%20Manual.pdf',
    galleryImages: commonGallery.microscope,
    videoUrls: [
      { title: 'Basic microscope setup and use', url: 'https://www.youtube.com/watch?v=SUo2fHZaZCU' },
      { title: 'How to use a compound microscope', url: 'https://www.youtube.com/watch?v=7WIZWoOLCEs' },
    ],
    learningMaterials: [
      { title: 'Compound microscope student learning guide', type: 'PDF Manual', url: 'https://www.dcl.org/shared-assets/docs/hosted/microscope-manual.pdf' },
      { title: 'Microscope setup tutorial video', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=SUo2fHZaZCU' },
      { title: 'Compound microscope handling and parts manual', type: 'PDF Manual', url: 'https://www.microscope.com/support/manuals/omano/OM118-M%20Series%20Manual.pdf' },
    ],
  },
  oscilloscope: {
    image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1200&q=80',
    manualUrl: 'https://www.batronix.com/pdf/Rigol/UserGuide/DS1000Z_UserGuide_EN.pdf',
    safetyManualUrl: 'https://www.batronix.com/pdf/Rigol/UserGuide/DS1000Z_UserGuide_EN.pdf',
    galleryImages: commonGallery.electronics,
    videoUrls: [
      { title: 'Rigol DS1054Z oscilloscope basics', url: 'https://www.youtube.com/watch?v=hIz6rD4TVBA' },
      { title: 'Learning how to use Rigol DS1054Z', url: 'https://www.youtube.com/watch?v=DgiyAu0b50g' },
    ],
    learningMaterials: [
      { title: 'Rigol DS1000Z user guide', type: 'PDF Manual', url: 'https://www.batronix.com/pdf/Rigol/UserGuide/DS1000Z_UserGuide_EN.pdf' },
      { title: 'Oscilloscope basics article', type: 'Other File', url: 'https://www.rigolna.com/basics-of-oscilloscopes/' },
      { title: 'DS1054Z basics video', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=hIz6rD4TVBA' },
    ],
  },
  multimeter: {
    image: 'https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?auto=format&fit=crop&w=1200&q=80',
    manualUrl: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf',
    safetyManualUrl: 'https://media.fluke.com/5e1db354-3a6e-49cf-9edd-b10800c0e608_original%20file.pdf',
    galleryImages: commonGallery.electronics,
    videoUrls: [
      { title: 'How to use a Fluke 117 multimeter', url: 'https://www.youtube.com/watch?v=uMSFrv1UVMc' },
      { title: 'Multimeter professional use guide', url: 'https://www.youtube.com/watch?v=0loXukB302Q' },
    ],
    learningMaterials: [
      { title: 'Fluke 117 user manual', type: 'PDF Manual', url: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf' },
      { title: 'Fluke 117 safety information', type: 'PDF Manual', url: 'https://media.fluke.com/5e1db354-3a6e-49cf-9edd-b10800c0e608_original%20file.pdf' },
      { title: 'Fluke 117 hands-on tutorial', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=uMSFrv1UVMc' },
    ],
  },
  power: {
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
    manualUrl: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4151/KA3000_6000_Series_Man.pdf',
    safetyManualUrl: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4151/KA3000_6000_Series_Man.pdf',
    galleryImages: commonGallery.electronics,
    videoUrls: [
      { title: 'Korad KA3005P power supply overview', url: 'https://www.youtube.com/watch?v=yksjM7GAdQQ' },
      { title: 'How to use a DC power supply step by step', url: 'https://www.youtube.com/watch?v=7WQ7L1BvM6o' },
    ],
    learningMaterials: [
      { title: 'Korad KA3000/6000 series user manual', type: 'PDF Manual', url: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4151/KA3000_6000_Series_Man.pdf' },
      { title: 'KA3005P programmable power supply tutorial', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=yksjM7GAdQQ' },
      { title: 'DC power supply operating tutorial', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=7WQ7L1BvM6o' },
    ],
  },
  laptop: {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    manualUrl: 'https://www.dell.com/support/manuals/en-us/latitude-14-5440-laptop/latitude-5440-owners-manual/views-of-latitude-5440?guid=guid-d3cb1479-5af9-4e2f-9a8b-416fc88c775d&lang=en-us',
    safetyManualUrl: 'https://www.dell.com/support/product-details/en-us/product/latitude-14-5440-laptop/resources/manuals',
    galleryImages: commonGallery.computing,
    videoUrls: [
      { title: 'Dell Latitude 5440 disassembly and repair tutorial', url: 'https://www.youtube.com/watch?v=GywE9LwwTtE' },
      { title: 'Dell Latitude 5440 battery replacement', url: 'https://www.youtube.com/watch?v=vXjSRypwRCA' },
    ],
    learningMaterials: [
      { title: 'Dell Latitude 5440 owner manual', type: 'PDF Manual', url: 'https://www.dell.com/support/manuals/en-us/latitude-14-5440-laptop/latitude-5440-owners-manual/views-of-latitude-5440?guid=guid-d3cb1479-5af9-4e2f-9a8b-416fc88c775d&lang=en-us' },
      { title: 'Dell Latitude 5440 manuals and documents', type: 'Other File', url: 'https://www.dell.com/support/product-details/en-us/product/latitude-14-5440-laptop/resources/manuals' },
      { title: 'Dell Latitude 5440 maintenance video', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=GywE9LwwTtE' },
    ],
  },
  router: {
    image: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=1200&q=80',
    manualUrl: 'https://www.cisco.com/c/en/us/td/docs/routers/access/4400/hardware/installation/guide4400-4300/C4400_isr.html',
    safetyManualUrl: 'https://www.cisco.com/c/en/us/td/docs/routers/access/4400/hardware/installation/guide4400-4300/C4400_isr.html',
    galleryImages: commonGallery.networking,
    videoUrls: [
      { title: 'Cisco ISR 4321 basic configuration setup', url: 'https://www.youtube.com/watch?v=tBktzISHPBg' },
      { title: 'Cisco router basic configuration from scratch', url: 'https://www.youtube.com/watch?v=eP7XH_O-tGs' },
    ],
    learningMaterials: [
      { title: 'Cisco 4000 Series ISR hardware installation guide', type: 'PDF Manual', url: 'https://www.cisco.com/c/en/us/td/docs/routers/access/4400/hardware/installation/guide4400-4300/C4400_isr.html' },
      { title: 'Cisco ISR 4321 product support page', type: 'Other File', url: 'https://www.cisco.com/c/en/us/support/routers/4321-integrated-services-router/model.html' },
      { title: 'Cisco ISR 4321 setup tutorial', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=tBktzISHPBg' },
    ],
  },
  plc: {
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=1200&q=80',
    manualUrl: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf',
    safetyManualUrl: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf',
    galleryImages: commonGallery.electronics,
    videoUrls: [
      { title: 'S7-1200 PLC introduction for beginners', url: 'https://www.youtube.com/watch?v=JxtuQ5qVRyY' },
      { title: 'Siemens S7-1200 PLC programming course', url: 'https://www.youtube.com/watch?v=gvM3rcryicM' },
    ],
    learningMaterials: [
      { title: 'Siemens S7-1200 system manual', type: 'PDF Manual', url: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf' },
      { title: 'S7-1200 PLC beginner tutorial', type: 'YouTube Tutorial', url: 'https://www.youtube.com/watch?v=JxtuQ5qVRyY' },
      { title: 'Siemens TIA Portal training playlist', type: 'YouTube Tutorial', url: 'https://www.youtube.com/playlist?list=PLyL0ResmI4Q3HIWvnMM18XpXkFMsS9Bcj' },
    ],
  },
};

function profileFor(item) {
  const haystack = `${item.name || ''} ${item.modelNumber || ''} ${item.category || ''} ${item.assetTag || ''}`.toLowerCase();
  if (haystack.includes('microscope')) return profiles.microscope;
  if (haystack.includes('oscilloscope') || haystack.includes('rigol') || haystack.includes('osc-')) return profiles.oscilloscope;
  if (haystack.includes('multimeter') || haystack.includes('fluke') || haystack.includes('dmm')) return profiles.multimeter;
  if (haystack.includes('power supply') || haystack.includes('korad') || haystack.includes('psu')) return profiles.power;
  if (haystack.includes('laptop') || haystack.includes('latitude') || haystack.includes('computing')) return profiles.laptop;
  if (haystack.includes('router') || haystack.includes('cisco')) return profiles.router;
  if (haystack.includes('plc') || haystack.includes('siemens')) return profiles.plc;
  return profiles.microscope;
}

function chooseDescription(item, profile) {
  const current = String(item.description || '').trim();
  if (!current || current === 'Newly registered laboratory equipment.') return profile.description || current;
  return current;
}

function chooseUrl(current, next) {
  if (!current || current === '#') return next;
  return current;
}

async function populateEquipmentLearningMaterials() {
  await sequelize.authenticate();
  const records = await Equipment.findAll();
  let updated = 0;

  for (const record of records) {
    const profile = profileFor(record);
    const payload = {
      description: chooseDescription(record, profile),
      image: chooseUrl(record.image, profile.image),
      manualUrl: chooseUrl(record.manualUrl, profile.manualUrl),
      safetyManualUrl: chooseUrl(record.safetyManualUrl, profile.safetyManualUrl),
      galleryImages: appendUnique(record.galleryImages, profile.galleryImages.map((url) => ({ title: 'Equipment reference image', url }))).map((item) => item.url),
      videoUrls: appendUnique(record.videoUrls, profile.videoUrls),
      learningMaterials: appendUnique(record.learningMaterials, profile.learningMaterials),
    };

    await record.update(payload);
    updated += 1;
  }

  console.log(`Updated learning materials for ${updated} equipment records.`);
  return updated;
}

if (require.main === module) {
  populateEquipmentLearningMaterials()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { populateEquipmentLearningMaterials };
