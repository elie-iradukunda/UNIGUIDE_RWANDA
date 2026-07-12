const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Equipment, LabAssignment, Reservation } = require('../models');

const catalog = [
  {
    name: 'Laboratory Microscope',
    assetTag: 'MC-001',
    modelNumber: 'Compound Binocular Microscope',
    serialNumber: 'RW-MIC-2026-001',
    category: 'Lab Science',
    department: 'Mechatronic',
    location: 'Engineering Block, Floor 1, General Laboratory, Bench M-01',
    status: 'Available',
    stock: 5,
    available: 5,
    purchaseDate: '2025-03-10',
    warrantyExpiry: '2028-03-10',
    cost: 520,
    supplier: 'Official Store',
    requiresMaintenance: false,
    allowOvernight: false,
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Compound laboratory microscope for observing prepared slides, biological samples, and fine material structures. Students should learn focusing, objective selection, illumination control, cleaning, and safe handling before use.',
    manualUrl: 'https://www.dcl.org/shared-assets/docs/hosted/microscope-manual.pdf',
    safetyManualUrl: 'https://www.microscope.com/support/manuals/omano/OM118-M%20Series%20Manual.pdf',
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
  {
    name: 'Oscilloscope',
    assetTag: 'OSC-001',
    modelNumber: 'Rigol DS1054Z',
    serialNumber: 'RW-OSC-2026-001',
    category: 'Electronics',
    department: 'Electronic and Telecommunication',
    location: 'Electronics Block, Floor 1, Circuit Lab, Bench E-04',
    status: 'Available',
    stock: 5,
    available: 4,
    purchaseDate: '2025-02-12',
    warrantyExpiry: '2028-02-12',
    cost: 640,
    supplier: 'Official Store',
    requiresMaintenance: false,
    allowOvernight: false,
    image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Four-channel digital oscilloscope for measuring, visualising, and analysing electrical signals during electronics practical work.',
    manualUrl: 'https://www.batronix.com/pdf/Rigol/UserGuide/DS1000Z_UserGuide_EN.pdf',
    safetyManualUrl: 'https://www.batronix.com/pdf/Rigol/UserGuide/DS1000Z_UserGuide_EN.pdf',
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
  {
    name: 'Digital Multimeter',
    assetTag: 'DMM-004',
    modelNumber: 'Fluke 117',
    serialNumber: 'RW-DMM-2026-004',
    category: 'Electronics',
    department: 'ICT',
    location: 'ICT Block, Ground Floor, ICT Lab, Cabinet C-02',
    status: 'Available',
    stock: 10,
    available: 8,
    purchaseDate: '2024-11-08',
    warrantyExpiry: '2027-11-08',
    cost: 210,
    supplier: 'Official Store',
    requiresMaintenance: false,
    allowOvernight: true,
    image: 'https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581092921461-39b9d08a9b21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Portable true-RMS multimeter for voltage, resistance, continuity, current checks, and safe electrical troubleshooting.',
    manualUrl: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf',
    safetyManualUrl: 'https://media.fluke.com/5e1db354-3a6e-49cf-9edd-b10800c0e608_original%20file.pdf',
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
  {
    name: 'DC Power Supply',
    assetTag: 'PSU-002',
    modelNumber: 'Korad KA3005P',
    serialNumber: 'RW-PSU-2026-002',
    category: 'Power Systems',
    department: 'Renewable Energy',
    location: 'Energy Block, Floor 1, Energy Lab 1, Bench P-03',
    status: 'Available',
    stock: 6,
    available: 5,
    purchaseDate: '2025-05-20',
    warrantyExpiry: '2028-05-20',
    cost: 380,
    supplier: 'Official Store',
    requiresMaintenance: false,
    allowOvernight: false,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Programmable bench DC power supply for controlled voltage/current output during circuit prototyping and renewable-energy laboratory exercises.',
    manualUrl: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4151/KA3000_6000_Series_Man.pdf',
    safetyManualUrl: 'https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4151/KA3000_6000_Series_Man.pdf',
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
  {
    name: 'PLC Training Kit',
    assetTag: 'PLC-002',
    modelNumber: 'Siemens S7-1200',
    serialNumber: 'RW-PLC-2026-002',
    category: 'Automation',
    department: 'Mechatronic',
    location: 'Engineering Block, Ground Floor, Automation Lab, Station A-06',
    status: 'Available',
    stock: 7,
    available: 5,
    purchaseDate: '2025-01-29',
    warrantyExpiry: '2028-01-29',
    cost: 1450,
    supplier: 'Official Store',
    requiresMaintenance: false,
    allowOvernight: false,
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581093458791-9f3c3900df7b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Siemens S7-1200 PLC training kit for sensors, actuators, ladder logic, automation, and industrial control practical exercises.',
    manualUrl: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf',
    safetyManualUrl: 'https://support.industry.siemens.com/cs/attachments/109977302/s71200_system_manual_en-US.pdf',
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
];

const catalogTags = catalog.map((item) => item.assetTag);

async function normalizeEquipmentCatalog() {
  await sequelize.authenticate();
  const keepIds = [];

  for (const item of catalog) {
    const existing = await Equipment.findAll({
      where: { assetTag: item.assetTag },
      order: [['createdAt', 'ASC']],
    });

    const keeper = existing[0] || await Equipment.create(item);
    if (existing.length > 1) {
      const duplicateIds = existing.slice(1).map((record) => record.id);
      await Reservation.update({ equipmentId: keeper.id }, { where: { equipmentId: { [Op.in]: duplicateIds } } });
      await LabAssignment.update(
        { equipmentId: keeper.id, equipmentName: item.name },
        { where: { equipmentId: { [Op.in]: duplicateIds } } },
      );
      await Equipment.destroy({ where: { id: { [Op.in]: duplicateIds } } });
    }

    await keeper.update(item);
    keepIds.push(keeper.id);
  }

  const removable = await Equipment.findAll({
    where: {
      [Op.or]: [
        { id: { [Op.notIn]: keepIds } },
        { assetTag: { [Op.notIn]: catalogTags } },
      ],
    },
  });
  const removableIds = removable.map((record) => record.id);

  if (removableIds.length) {
    await Reservation.destroy({ where: { equipmentId: { [Op.in]: removableIds } } });
    await LabAssignment.destroy({ where: { equipmentId: { [Op.in]: removableIds } } });
    await Equipment.destroy({ where: { id: { [Op.in]: removableIds } } });
  }

  console.log(`Normalized equipment catalog to ${catalog.length} records; removed ${removableIds.length} extras.`);
  return { kept: catalog.length, removed: removableIds.length };
}

if (require.main === module) {
  normalizeEquipmentCatalog()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { catalog, catalogTags, normalizeEquipmentCatalog };
