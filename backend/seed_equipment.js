const sequelize = require('./config/db');
const Equipment = require('./models/Equipment');

async function seedEquipment() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');
    // Use alter:true to add any new columns (qrCode, safetyManualUrl) to existing table
    await sequelize.sync({ alter: true });
    console.log('Database schema synced.');

    const equipmentList = [
      // ── 1. OSCILLOSCOPE ──────────────────────────────────────────────
      {
        name: 'Digital Oscilloscope',
        modelNumber: 'Rigol DS1054Z',
        category: 'Measurement & Testing',
        department: 'Mechatronic',
        serialNumber: 'DS1ZA192300001',
        assetTag: 'OSC-001',
        description: 'A 4-channel digital oscilloscope with 50 MHz bandwidth, 1 GSa/s sample rate, and 12 Mpts memory depth. Used for measuring and analyzing electrical signals in time domain. It displays voltage changes over time on its screen, allowing engineers to observe signal waveforms, measure frequency, amplitude, rise time, and other signal characteristics. Essential for debugging circuits, testing amplifiers, and verifying digital communication signals.',
        purchaseDate: '2024-01-15',
        warrantyExpiry: '2027-01-15',
        cost: 399.00,
        supplier: 'Amazon Business',
        status: 'Available',
        location: 'Electronics Lab 2',
        stock: 5,
        available: 3,
        image: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&auto=format&fit=crop&q=60',
        galleryImages: [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1517420879524-86d64ac2f339?w=800&auto=format&fit=crop&q=60'
        ],
        videoUrls: [
          { title: 'How to Use an Oscilloscope - Beginner Tutorial', url: 'https://www.youtube.com/watch?v=u4zyptPLlJI' },
          { title: 'Rigol DS1054Z Full Review & Tutorial', url: 'https://www.youtube.com/watch?v=hJGlpKjbpbQ' },
          { title: 'Oscilloscope Basics - How it Works', url: 'https://www.youtube.com/watch?v=CzY2abWCVTY' }
        ],
        manualUrl: 'https://www.batronix.com/files/Rigol/Oszilloskope/DS1000Z/DS1000Z_UserGuide.pdf',
        safetyManualUrl: 'https://www.rigol.eu/Public/Uploads/uploadfile/files/20220711/Safety-Information-EN.pdf'
      },

      // ── 2. DIGITAL MULTIMETER ────────────────────────────────────────
      {
        name: 'Digital Multimeter',
        modelNumber: 'Fluke 117',
        category: 'Measurement & Testing',
        department: 'Mechatronic',
        serialNumber: 'FLK117-2024-0042',
        assetTag: 'DMM-004',
        description: 'A true-RMS digital multimeter designed for electricians and technicians. Measures AC/DC voltage up to 600V, AC/DC current up to 10A, resistance up to 40 MΩ, capacitance, frequency, and continuity. Features non-contact voltage detection, AutoVolt automatic AC/DC selection, and a large backlit display. Ideal for troubleshooting electrical systems, testing components, and verifying circuit connections.',
        purchaseDate: '2024-03-20',
        warrantyExpiry: '2027-03-20',
        cost: 189.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'Electronics Lab 1',
        stock: 12,
        available: 10,
        image: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=800&auto=format&fit=crop&q=60',
        galleryImages: [
          'https://images.unsplash.com/photo-1616400619175-5beda3a17896?w=800&auto=format&fit=crop&q=60'
        ],
        videoUrls: [
          { title: 'How to Use a Multimeter for Beginners', url: 'https://www.youtube.com/watch?v=TdUK6RPdIGo' },
          { title: 'Fluke 117 Multimeter Review', url: 'https://www.youtube.com/watch?v=bF3OyQ3HwfU' },
          { title: 'Multimeter Tutorial - Measuring Voltage, Current, Resistance', url: 'https://www.youtube.com/watch?v=SLkPtmnglOI' }
        ],
        manualUrl: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf',
        safetyManualUrl: 'https://dam-assets.fluke.com/s3fs-public/117___umeng0200.pdf'
      },

      // ── 3. DC POWER SUPPLY ───────────────────────────────────────────
      {
        name: 'DC Power Supply',
        modelNumber: 'Rigol DP832',
        category: 'Power Equipment',
        department: 'Mechatronic',
        serialNumber: 'DP8A192300015',
        assetTag: 'PSU-002',
        description: 'A programmable triple-output linear DC power supply. Channel 1: 30V/3A, Channel 2: 30V/3A, Channel 3: 5V/3A. Total power 195W. Features independent or series/parallel output modes, over-voltage/over-current protection, timer function, and USB/LAN connectivity. Used for powering circuits during development and testing, providing clean regulated DC voltage to sensitive electronics, and simulating battery or power supply conditions.',
        purchaseDate: '2024-02-10',
        warrantyExpiry: '2027-02-10',
        cost: 449.00,
        supplier: 'Amazon Business',
        status: 'Available',
        location: 'Electronics Lab 2',
        stock: 4,
        available: 3,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'How to Use a DC Power Supply', url: 'https://www.youtube.com/watch?v=hv9dK8bFSIo' },
          { title: 'Rigol DP832 Power Supply Review', url: 'https://www.youtube.com/watch?v=0mY1DCzFGyA' },
          { title: 'Lab Power Supply Basics for Beginners', url: 'https://www.youtube.com/watch?v=Edel5FJq8EY' }
        ],
        manualUrl: 'https://www.batronix.com/files/Rigol/Labornetzgeraete/DP800/DP800_UserGuide.pdf',
        safetyManualUrl: 'https://www.rigol.eu/Public/Uploads/uploadfile/files/20220711/Safety-Information-EN.pdf'
      },

      // ── 4. FUNCTION GENERATOR ────────────────────────────────────────
      {
        name: 'Function Generator',
        modelNumber: 'Rigol DG1022Z',
        category: 'Signal Generation',
        department: 'Mechatronic',
        serialNumber: 'DG1ZA192300008',
        assetTag: 'FG-003',
        description: 'A dual-channel arbitrary waveform generator with 25 MHz bandwidth. Generates sine, square, ramp, pulse, noise, and arbitrary waveforms. Features 200 MSa/s sample rate, 16-bit vertical resolution, and built-in modulation (AM, FM, PM, ASK, FSK, PSK). Used for testing amplifiers, filters, and communication circuits by providing precise signal sources. Essential for frequency response analysis, filter characterization, and digital logic testing.',
        purchaseDate: '2024-04-05',
        warrantyExpiry: '2027-04-05',
        cost: 329.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'Electronics Lab 2',
        stock: 3,
        available: 2,
        image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'Function Generator Explained', url: 'https://www.youtube.com/watch?v=kqCV8HkY6aE' },
          { title: 'How to Use a Function Generator - Tutorial', url: 'https://www.youtube.com/watch?v=Y1KE8eAC9Bk' },
          { title: 'Signal Generator Basics', url: 'https://www.youtube.com/watch?v=Y2sSgBfdMr4' }
        ],
        manualUrl: 'https://www.batronix.com/files/Rigol/Funktionsgeneratoren/DG1000Z/DG1000Z_UserGuide.pdf',
        safetyManualUrl: 'https://www.rigol.eu/Public/Uploads/uploadfile/files/20220711/Safety-Information-EN.pdf'
      },

      // ── 5. SOLDERING STATION ─────────────────────────────────────────
      {
        name: 'Soldering Station',
        modelNumber: 'Hakko FX-888D',
        category: 'Hand Tools',
        department: 'Mechatronic',
        serialNumber: 'HK888D-2024-0019',
        assetTag: 'SOL-005',
        description: 'A digital temperature-controlled soldering station with adjustable temperature range of 120°C to 480°C. Features a ceramic heating element for fast heat recovery, digital LCD display with password-protected presets, and ergonomic lightweight iron. Used for soldering electronic components onto PCBs, rework of surface-mount devices, wire tinning, and desoldering. Essential tool for any electronics lab for assembling and repairing circuits.',
        purchaseDate: '2024-05-12',
        warrantyExpiry: '2026-05-12',
        cost: 109.95,
        supplier: 'Amazon Business',
        status: 'Available',
        location: 'Electronics Lab 1',
        stock: 8,
        available: 6,
        image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'How to Solder - Complete Beginner Guide', url: 'https://www.youtube.com/watch?v=Qps9woUGkvI' },
          { title: 'Hakko FX-888D Soldering Station Review', url: 'https://www.youtube.com/watch?v=scvS2yeUH00' },
          { title: 'Soldering Crash Course: Basic Techniques', url: 'https://www.youtube.com/watch?v=6rmErwU5E-k' }
        ],
        manualUrl: 'https://doc.hakko.com/downloading/FX-888D_EN.pdf',
        safetyManualUrl: 'https://doc.hakko.com/downloading/FX-888D_EN.pdf'
      },

      // ── 6. ARDUINO MEGA KIT ──────────────────────────────────────────
      {
        name: 'Arduino Mega 2560 Kit',
        modelNumber: 'Arduino Mega 2560 Rev3',
        category: 'Microcontrollers',
        department: 'Mechatronic',
        serialNumber: 'ARD-MEGA-2024-0023',
        assetTag: 'ARD-006',
        description: 'A comprehensive Arduino Mega 2560 microcontroller development kit. Includes the Mega 2560 board (54 digital I/O pins, 16 analog inputs, 4 UARTs), breadboard, jumper wires, resistors, LEDs, LCD display, servo motors, stepper motor, ultrasonic sensor, temperature sensor, relay module, and more. Used for learning embedded systems programming, prototyping IoT projects, controlling motors and actuators, reading sensor data, and building automation systems.',
        purchaseDate: '2024-06-01',
        warrantyExpiry: '2026-06-01',
        cost: 49.99,
        supplier: 'Amazon Business',
        status: 'Available',
        location: 'Mechatronics Lab',
        stock: 15,
        available: 10,
        image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=60',
        galleryImages: [
          'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60'
        ],
        videoUrls: [
          { title: 'Arduino Tutorial for Beginners - Full Course', url: 'https://www.youtube.com/watch?v=zJ-LqeX_fLU' },
          { title: 'Getting Started with Arduino Mega 2560', url: 'https://www.youtube.com/watch?v=BtLwoNJ6klE' },
          { title: 'Arduino Projects for Beginners', url: 'https://www.youtube.com/watch?v=09oSMY9mKX0' }
        ],
        manualUrl: 'https://docs.arduino.cc/resources/datasheets/A000067-datasheet.pdf',
        safetyManualUrl: null
      },

      // ── 7. PLC KIT ───────────────────────────────────────────────────
      {
        name: 'PLC Kit',
        modelNumber: 'Siemens S7-1200',
        category: 'Automation',
        department: 'Mechatronic',
        serialNumber: 'S7-1200-2024-0011',
        assetTag: 'PLC-002',
        description: 'A Siemens SIMATIC S7-1200 Programmable Logic Controller (PLC) training kit. Includes CPU 1214C DC/DC/DC with 14 DI, 10 DO, 2 AI, integrated Ethernet (PROFINET), and signal board. Comes with TIA Portal software for programming in Ladder Logic (LAD), Function Block Diagram (FBD), and Structured Text (SCL). Used for learning industrial automation, programming motor controls, implementing PID controllers, building conveyor systems, and HMI integration.',
        purchaseDate: '2024-01-20',
        warrantyExpiry: '2027-01-20',
        cost: 899.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'Automation Lab',
        stock: 3,
        available: 2,
        image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'PLC Programming Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=JrZ1Pf7S6cU' },
          { title: 'Siemens S7-1200 PLC - Getting Started', url: 'https://www.youtube.com/watch?v=dcNlhMiREi8' },
          { title: 'Ladder Logic Programming - Full Course', url: 'https://www.youtube.com/watch?v=gHLOaSiYbX4' }
        ],
        manualUrl: 'https://cache.industry.siemens.com/dl/files/465/36932465/att_106119/v1/s71200_system_manual_en-US_en-US.pdf',
        safetyManualUrl: 'https://cache.industry.siemens.com/dl/files/465/36932465/att_106119/v1/s71200_system_manual_en-US_en-US.pdf'
      },

      // ── 8. 3D PRINTER ────────────────────────────────────────────────
      {
        name: '3D Printer',
        modelNumber: 'Creality Ender-3 V3',
        category: 'Manufacturing',
        department: 'Mechatronic',
        serialNumber: 'CR-ENDER3V3-0007',
        assetTag: '3DP-001',
        description: 'An FDM 3D printer with 220x220x250mm build volume and CoreXZ structure for high-speed printing up to 600mm/s. Features auto bed leveling, direct drive extruder, and supports PLA, PETG, TPU, and ABS filaments. Used for rapid prototyping of mechanical parts, creating custom enclosures for electronics, fabricating jigs and fixtures, producing scale models, and manufacturing replacement parts for laboratory equipment.',
        purchaseDate: '2024-07-15',
        warrantyExpiry: '2025-07-15',
        cost: 219.00,
        supplier: 'Amazon Business',
        status: 'Available',
        location: 'Fabrication Lab',
        stock: 2,
        available: 1,
        image: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800&auto=format&fit=crop&q=60',
        galleryImages: [
          'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=800&auto=format&fit=crop&q=60'
        ],
        videoUrls: [
          { title: '3D Printing for Beginners - Complete Guide', url: 'https://www.youtube.com/watch?v=GJ98Lydc54k' },
          { title: 'Creality Ender-3 V3 Setup & First Print', url: 'https://www.youtube.com/watch?v=dQ0q9zn3cGs' },
          { title: 'Beginner Guide to 3D Printing Terminology', url: 'https://www.youtube.com/watch?v=nb-Bzf4nQdE' }
        ],
        manualUrl: 'https://img.staticdj.com/0b4ce4ec3c8c48baa5a5da0283b15081.pdf',
        safetyManualUrl: 'https://img.staticdj.com/0b4ce4ec3c8c48baa5a5da0283b15081.pdf'
      },

      // ── 9. NETWORK ROUTER ────────────────────────────────────────────
      {
        name: 'Cisco Router',
        modelNumber: 'Cisco 1941',
        category: 'Networking',
        department: 'ICT',
        serialNumber: 'CISCO-1941-2024-0003',
        assetTag: 'RTR-003',
        description: 'A Cisco 1941 Integrated Services Router for networking education. Features 2 GE WAN ports, integrated hardware VPN encryption, and support for concurrent services. Used for learning network configuration, routing protocols (RIP, OSPF, EIGRP, BGP), VPN setup, access control lists (ACLs), NAT/PAT, VLAN routing, and QoS. Essential for CCNA/CCNP certification preparation and understanding enterprise network architectures.',
        purchaseDate: '2023-09-10',
        warrantyExpiry: '2026-09-10',
        cost: 349.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'Networking Lab',
        stock: 6,
        available: 4,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'Cisco Router Configuration Step by Step', url: 'https://www.youtube.com/watch?v=lZq1DY7wLME' },
          { title: 'Networking Fundamentals - Full Course', url: 'https://www.youtube.com/watch?v=qiQR5rTSshw' },
          { title: 'How to Configure a Cisco Router for Beginners', url: 'https://www.youtube.com/watch?v=n2D1o-aM-2s' }
        ],
        manualUrl: 'https://www.cisco.com/c/en/us/td/docs/routers/access/1900/hardware/installation/guide/1941.pdf',
        safetyManualUrl: null
      },

      // ── 10. NETWORK SWITCH ───────────────────────────────────────────
      {
        name: 'Managed Network Switch',
        modelNumber: 'Cisco Catalyst 2960',
        category: 'Networking',
        department: 'ICT',
        serialNumber: 'CISCO-2960-2024-0007',
        assetTag: 'SW-007',
        description: 'A 24-port Cisco Catalyst 2960 managed Ethernet switch. Features 24x 10/100 Fast Ethernet ports and 2x GE uplinks. Supports VLANs, Spanning Tree Protocol (STP), port security, DHCP snooping, and 802.1X port-based authentication. Used for learning Layer 2 switching concepts, VLAN configuration, trunk links, EtherChannel, switch security, and network segmentation. Critical for networking certification labs.',
        purchaseDate: '2023-09-10',
        warrantyExpiry: '2026-09-10',
        cost: 289.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'Networking Lab',
        stock: 8,
        available: 6,
        image: 'https://images.unsplash.com/photo-1606765962248-7ff407b51667?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'How to Configure a Cisco Switch - Beginner Guide', url: 'https://www.youtube.com/watch?v=9eH16Fxeb9o' },
          { title: 'VLANs Explained - Full Tutorial', url: 'https://www.youtube.com/watch?v=jC6MJTh9fRE' },
          { title: 'Cisco Switch Configuration Step by Step', url: 'https://www.youtube.com/watch?v=6-Ka5i0jUJo' }
        ],
        manualUrl: 'https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/hardware/installation/guide/2960_hig.pdf',
        safetyManualUrl: null
      },

      // ── 11. LAPTOP ───────────────────────────────────────────────────
      {
        name: 'Laptop',
        modelNumber: 'Dell Latitude 5540',
        category: 'Computers',
        department: 'ICT',
        serialNumber: 'DELL-LAT5540-0015',
        assetTag: 'LAP-015',
        description: 'A Dell Latitude 5540 business laptop with 13th Gen Intel Core i7, 16GB DDR5 RAM, 512GB NVMe SSD, and 15.6" FHD display. Runs Ubuntu Linux 22.04 LTS and Windows 11 dual-boot. Pre-installed with development tools: VS Code, Python, GCC, Docker, Wireshark, MATLAB, and TIA Portal. Used for software development, network analysis, simulation, CAD/CAM design, and running virtual machines for various lab exercises.',
        purchaseDate: '2024-08-01',
        warrantyExpiry: '2027-08-01',
        cost: 1099.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'ICT Computer Lab',
        stock: 20,
        available: 15,
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60',
        galleryImages: [],
        videoUrls: [
          { title: 'Setting Up a Development Environment on Ubuntu', url: 'https://www.youtube.com/watch?v=GZMsTGBxJYk' },
          { title: 'VS Code Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=VqCgcpAypFQ' }
        ],
        manualUrl: 'https://www.dell.com/support/manuals/en-us/latitude-15-5540-laptop/lat_5540_setup_specs/set-up-your-dell-latitude-5540?guid=guid-e63f85f7-fe61-46ec-9eb0-2a662e4e4589',
        safetyManualUrl: null
      },

      // ── 12. SOLAR PV TRAINING KIT ────────────────────────────────────
      {
        name: 'Solar PV Training Kit',
        modelNumber: 'Leybold 313 Solar',
        category: 'Renewable Energy',
        department: 'Renewable Energy',
        serialNumber: 'SOL-PV-2024-0002',
        assetTag: 'SOL-PV-001',
        description: 'A comprehensive solar photovoltaic training system. Includes 20W monocrystalline solar panels, charge controller, 12V battery bank, inverter, load bank, irradiance meter, and data acquisition module. Used for studying solar cell I-V characteristics, maximum power point tracking (MPPT), series/parallel panel configurations, battery charging algorithms, grid-tie vs off-grid system design, and measuring solar energy conversion efficiency.',
        purchaseDate: '2024-03-01',
        warrantyExpiry: '2027-03-01',
        cost: 1250.00,
        supplier: 'Official Store',
        status: 'Available',
        location: 'Renewable Energy Lab',
        stock: 2,
        available: 2,
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=60',
        galleryImages: [
          'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&auto=format&fit=crop&q=60'
        ],
        videoUrls: [
          { title: 'How Solar Panels Work - Explained', url: 'https://www.youtube.com/watch?v=xKxrkht7CpY' },
          { title: 'Solar Panel I-V Curve Measurement', url: 'https://www.youtube.com/watch?v=L4fDJk3HXCM' },
          { title: 'Complete Solar Panel Installation Tutorial', url: 'https://www.youtube.com/watch?v=jSNCqQ5-HbQ' }
        ],
        manualUrl: 'https://www.ld-didactic.de/documents/en-US/EXP/P/P9/P9.4/P9.4.1/P9.4.1.1/P9411_e.pdf',
        safetyManualUrl: null
      }
    ];

    let created = 0;
    for (const eq of equipmentList) {
      const existing = await Equipment.findOne({ where: { assetTag: eq.assetTag } });
      if (!existing) {
        const newEq = await Equipment.create(eq);
        // Auto-generate QR code link
        newEq.qrCode = `http://localhost:5173/equipment/${newEq.id}`;
        await newEq.save();
        console.log(`✅ Created: ${eq.name} (${eq.assetTag}) - ${eq.department}`);
        created++;
      } else {
        console.log(`⏭️  Already exists: ${eq.name} (${eq.assetTag})`);
      }
    }

    console.log(`\n--- Seed Complete: ${created} new equipment items created ---`);
    console.log(`Total equipment in DB: ${await Equipment.count()}`);
    
    // Print out the IDs so we can test them
    const allEquipment = await Equipment.findAll({ attributes: ['id', 'name', 'assetTag'] });
    console.log('\n--- Equipment IDs for testing ---');
    allEquipment.forEach(eq => console.log(`  ${eq.assetTag}: ${eq.id}  →  http://localhost:5173/equipment/${eq.id}`));

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedEquipment();
