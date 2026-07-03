const sequelize = require('./config/db');
const Equipment = require('./models/Equipment');

const seedEquipment = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync models (force: false preserves existing, alter: true updates)
    await sequelize.sync({ alter: true });

    const equipmentData = [
      {
        name: "Solar PV Training System",
        modelNumber: "RE-SOLAR-202X",
        category: "Renewable Energy",
        department: "Renewable Energy",
        serialNumber: "SN-SOLAR-001",
        assetTag: "RE-LAB-05",
        description: "Complete photovoltaic training system for hands-on learning of solar energy principles. Includes 100W panel, charge controller, battery bank, and inverter. Perfect for understanding grid-tied and off-grid configurations.",
        purchaseDate: "2024-01-15",
        warrantyExpiry: "2026-01-15",
        cost: 1200.00,
        supplier: "Official Store",
        requiresMaintenance: true,
        allowOvernight: false,
        status: "Available",
        stock: 2,
        available: 2,
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1508514177221-188b1cf2f26f?q=80&w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?q=80&w=600&auto=format&fit=crop"
        ],
        videoUrls: [
          "https://www.youtube.com/watch?v=xKxrkht7CpY", // How Solar Panels Work
          "https://www.youtube.com/watch?v=L_qc-f7b57M"  // Installation Basics
        ],
        manualUrl: "https://www.solar-electric.com/lib/wind-sun/Solar_Panel_Installation_Manual.pdf"
      },
      {
        name: "Siemens S7-1200 PLC Kit",
        modelNumber: "S7-1200-EDU",
        category: "Automation",
        department: "Mechatronic",
        serialNumber: "SN-PLC-882",
        assetTag: "MEC-LAB-12",
        description: "Industrial automation training kit featuring the Siemens S7-1200 PLC. Comes with digital I/O modules, HMI interface, and TIA Portal software license. Essential for mechatronics and control systems courses.",
        purchaseDate: "2023-11-20",
        warrantyExpiry: "2025-11-20",
        cost: 850.50,
        supplier: "Amazon Business",
        requiresMaintenance: false,
        allowOvernight: true,
        status: "Available",
        stock: 5,
        available: 4,
        image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=600&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1537462713117-1a0dedbd8019?q=80&w=600&auto=format&fit=crop", 
          "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Siemens_S7-1200.jpg/640px-Siemens_S7-1200.jpg"
        ],
        videoUrls: [
          "https://www.youtube.com/watch?v=86T0bZpZpNc", // PLC Basics
          "https://www.youtube.com/watch?v=Pb--Xm8qOq4"  // TIA Portal Intro
        ],
        manualUrl: "https://cache.industry.siemens.com/dl/files/465/36932465/att_106119/v1/s71200_system_manual_en-US_en-US.pdf"
      },
      {
        name: "Cisco ISR 4331 Router",
        modelNumber: "ISR4331/K9",
        category: "Networking",
        department: "ICT",
        serialNumber: "FDO2211A02",
        assetTag: "ICT-NET-03",
        description: "Enterprise-grade Integrated Services Router for advanced networking labs. Supports SD-WAN, security features, and high-throughput routing. Used for CCNA and CCNP certification practice.",
        purchaseDate: "2024-02-01",
        warrantyExpiry: "2027-02-01",
        cost: 1500.00,
        supplier: "Local Vendor",
        requiresMaintenance: true,
        allowOvernight: false,
        status: "Available",
        stock: 3,
        available: 3,
        image: "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?q=80&w=600&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1558494949-ef2bb6db8744?q=80&w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1520869562399-e772f042f422?q=80&w=600&auto=format&fit=crop"
        ],
        videoUrls: [
          "https://www.youtube.com/watch?v=H8W9oMNSuwo", // Router Configuration
        ],
        manualUrl: "https://www.cisco.com/c/en/us/td/docs/routers/access/4400/hardware/installation/guide4400-4300/c4400_isg.pdf"
      },
      {
        name: "Tektronix TBS1052B Oscilloscope",
        modelNumber: "TBS1052B",
        category: "Electronics",
        department: "Electronic and Telecommunication",
        serialNumber: "C010293",
        assetTag: "ELE-TEST-09",
        description: "50 MHz, 2-Channel Digital Storage Oscilloscope. Essential for analyzing signal waveforms, debugging circuits, and testing electronic components. Features 1 GS/s sample rate.",
        purchaseDate: "2023-09-10",
        warrantyExpiry: "2026-09-10",
        cost: 450.00,
        supplier: "Official Store",
        requiresMaintenance: true,
        allowOvernight: true,
        status: "In Use",
        stock: 8,
        available: 2,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=600&auto=format&fit=crop",
        galleryImages: [
           "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=600&auto=format&fit=crop"
        ],
        videoUrls: [
          "https://www.youtube.com/watch?v=tznyDOsnJ1s", // How to use an Oscilloscope
        ],
        manualUrl: "https://download.tek.com/manual/TBS1000B-Digital-Storage-Oscilloscope-User-Manual-077088601.pdf"
      },
       {
        name: "Dobot Magician Robotic Arm",
        modelNumber: "DOBOT-MAGIC",
        category: "Robotics",
        department: "Mechatronic",
        serialNumber: "SN-ROBOT-004",
        assetTag: "MEC-ROB-04",
        description: "Desktop robotic arm for education. Capable of 3D printing, laser engraving, writing, and drawing. Great for learning kinematics and robot programming.",
        purchaseDate: "2024-03-01",
        warrantyExpiry: "2025-03-01",
        cost: 1600.00,
        supplier: "Amazon Business",
        requiresMaintenance: true,
        allowOvernight: false,
        status: "Maintenance",
        stock: 1,
        available: 0,
        image: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=600&auto=format&fit=crop",
        galleryImages: [
           "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop"
        ],
        videoUrls: [
          "https://www.youtube.com/watch?v=F0Zk8k7m7D4", // Dobot Demo
        ],
        manualUrl: "https://en.dobot.cn/products/education/magician.html"
      }
    ];

    for (const item of equipmentData) {
      await Equipment.create(item);
      console.log(`Created: ${item.name}`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedEquipment();
