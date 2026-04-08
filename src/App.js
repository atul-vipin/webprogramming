
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import './App.css';

const STORAGE_KEYS = {
  usersCsv: 'elcUsersCsv',
  session: 'elcSession',
  feedbackList: 'elcFeedbackList',
  contactList: 'elcContactList',
  assessmentList: 'elcAssessmentList'
};

const CSV_HEADER = ['fullName', 'email', 'password', 'course', 'location', 'registeredAt'];

const QUESTIONS = [
  {
    id: 'tv_q1',
    course: 'tv',
    text: 'Which board is known as the TV brain?',
    options: [
      { value: 'speaker', label: 'Speaker' },
      { value: 'mainboard', label: 'Main board', correct: true },
      { value: 'antenna', label: 'Antenna' }
    ]
  },
  {
    id: 'tv_q2',
    course: 'tv',
    text: 'Which section controls pixels on a TV screen?',
    options: [
      { value: 'audio', label: 'Audio board' },
      { value: 'tcon', label: 'T-CON board', correct: true },
      { value: 'remote', label: 'Remote battery' }
    ]
  },
  {
    id: 'tv_q3',
    course: 'tv',
    text: 'Which part mainly converts AC input to stable DC rails in a TV?',
    options: [
      { value: 'smps', label: 'Power supply (SMPS)', correct: true },
      { value: 'speaker', label: 'Speaker board' },
      { value: 'ir', label: 'IR board' }
    ]
  },
  {
    id: 'mob_q1',
    course: 'mobile',
    text: 'What powers a mobile phone?',
    options: [
      { value: 'camera', label: 'Camera module' },
      { value: 'battery', label: 'Battery', correct: true },
      { value: 'display', label: 'Display panel' }
    ]
  },
  {
    id: 'mob_q2',
    course: 'mobile',
    text: 'Which part runs apps and processing in mobile?',
    options: [
      { value: 'soc', label: 'SoC', correct: true },
      { value: 'speaker', label: 'Speaker' },
      { value: 'glass', label: 'Screen glass' }
    ]
  },
  {
    id: 'mob_q3',
    course: 'mobile',
    text: 'Which chip handles charging and power distribution in many phones?',
    options: [
      { value: 'pmic', label: 'PMIC / Power IC', correct: true },
      { value: 'mic', label: 'Microphone IC' },
      { value: 'led', label: 'Flash LED driver only' }
    ]
  },
  {
    id: 'both_q1',
    course: 'both',
    text: 'In combined diagnostics, what is the first common step for TV and mobile?',
    options: [
      { value: 'power', label: 'Verify input power path and primary rails', correct: true },
      { value: 'replace', label: 'Replace random board first' },
      { value: 'format', label: 'Factory reset immediately' }
    ]
  },
  {
    id: 'both_q2',
    course: 'both',
    text: 'Which pair is the best architecture comparison?',
    options: [
      { value: 'tcon_soc', label: 'TV T-CON path and mobile display/SoC pipeline', correct: true },
      { value: 'speaker_camera', label: 'TV speaker board and mobile camera lens' },
      { value: 'plastic', label: 'TV stand and mobile back cover' }
    ]
  },
  {
    id: 'both_q3',
    course: 'both',
    text: 'Which workflow is correct for both tracks?',
    options: [
      { value: 'measure', label: 'Symptom -> power checks -> signal checks -> module isolation', correct: true },
      { value: 'guess', label: 'Guess and swap parts until fixed' },
      { value: 'skip', label: 'Skip measurements to save time' }
    ]
  }
];
function initializeCsvStore() {
  if (!localStorage.getItem(STORAGE_KEYS.usersCsv)) {
    localStorage.setItem(STORAGE_KEYS.usersCsv, CSV_HEADER.join(',') + '\n');
  }
}

function parseUsersCsv(csvText) {
  if (!csvText) return [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const users = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = splitCsvLine(lines[i]);
    users.push({
      fullName: fields[0] || '',
      email: (fields[1] || '').toLowerCase(),
      password: fields[2] || '',
      course: fields[3] || '',
      location: fields[4] || '',
      registeredAt: fields[5] || ''
    });
  }
  return users;
}

function usersToCsv(users) {
  const rows = [CSV_HEADER.join(',')];
  users.forEach((user) => {
    rows.push([
      csvEscape(user.fullName),
      csvEscape(user.email),
      csvEscape(user.password),
      csvEscape(user.course),
      csvEscape(user.location),
      csvEscape(user.registeredAt)
    ].join(','));
  });
  return rows.join('\n') + '\n';
}

function splitCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  out.push(current);
  return out;
}

function csvEscape(value) {
  const text = String(value || '');
  if (text.indexOf('"') !== -1 || text.indexOf(',') !== -1 || text.indexOf('\n') !== -1) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function upsertUserIntoCsv(user) {
  const users = parseUsersCsv(localStorage.getItem(STORAGE_KEYS.usersCsv));
  const existingIndex = users.findIndex((entry) => entry.email === user.email);

  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  localStorage.setItem(STORAGE_KEYS.usersCsv, usersToCsv(users));
}

function authenticateUser(email, password) {
  const users = parseUsersCsv(localStorage.getItem(STORAGE_KEYS.usersCsv));
  return users.find((entry) => entry.email === email && entry.password === password) || null;
}

function getSessionUser() {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.session);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function setSessionUser(user) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

function clearSessionUser() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function formatCourse(course) {
  if (course === 'mobile') return 'Inner workings of mobile';
  if (course === 'tv') return 'Inner workings of television';
  return 'Inner workings of mobile and television';
}

function loadList(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    return [];
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function Navbar() {
  const user = getSessionUser();
  const location = useLocation();

  function handleLogout() {
    clearSessionUser();
    window.location.href = '/register';
  }

  return (
    <div className="navbar">
      <a href="/" className={location.pathname === '/' ? 'active-link' : ''}>Home</a>
      {!user && <a href="/register" className={location.pathname === '/register' ? 'active-link' : ''}>Login</a>}
      {user && <a href="/learn" className={location.pathname === '/learn' ? 'active-link' : ''}>Learn</a>}
      {user && <a href="/assessment" className={location.pathname === '/assessment' ? 'active-link' : ''}>Assessment</a>}
      <a href="/feedback.html">Feedback</a>
      <a href="/testimonials.html">Testimonials</a>
      <a href="/contact.html">Contact Us</a>
      {user && (
        <span className="nav-right">
          <button type="button" className="button tiny-btn" onClick={handleLogout}>Logout</button>
        </span>
      )}
    </div>
  );
}
function HomePage() {
  const user = getSessionUser();
  const [hint, setHint] = React.useState('');

  React.useEffect(() => {
    if (user) {
      setHint('You can open Learn and Assessment from the menu.');
    } else {
      setHint('Learn and Assessment become available after login.');
    }
  }, [user]);

  return (
    <>
      <Navbar />
      <div className="hero">
        <div className="container">
          <h1>Electronics Learning Center</h1>
          <p>Complete guide to TV and mobile internal parts and working principles</p>
          <div className="hero-buttons">
            {!user && <a href="/register" className="button">Register or Login</a>}
            <a href="/learn" className="button nav-protected">View Lessons</a>
          </div>
          <p id="homeAuthHint" role="status" aria-live="polite">{hint}</p>
        </div>
      </div>

      <div className="container">
        <h2>Course Overview</h2>

        <div className="card">
          <h3>Inner workings of television</h3>
          <ol>
            <li>Display Panel - LCD/LED screen</li>
            <li>Main Board - Processes all signals</li>
            <li>Power Supply - AC to DC conversion</li>
            <li>T-CON Board - Pixel control</li>
            <li>Backlight LEDs - Screen lighting</li>
            <li>Audio Board - Sound output</li>
            <li>IR Board - Remote receiver</li>
          </ol>
          <img src="/tv.jpg" alt="TV Internal Parts" style={{ width: '100%', maxWidth: '400px' }} />
        </div>

        <div className="card">
          <h3>Inner workings of mobile</h3>
          <ol>
            <li>Motherboard - Main circuit</li>
            <li>SoC - CPU + GPU + Modem</li>
            <li>RAM - App memory (4-16GB)</li>
            <li>Flash Storage - Photos/Apps</li>
            <li>Battery - 3000-5000mAh</li>
            <li>Display + Touch Layer</li>
            <li>Camera Modules</li>
            <li>Antennas - 5G/WiFi</li>
            <li>Sensors - Fingerprint etc.</li>
          </ol>
          <img src="/mobile.jpg" alt="Mobile Internal Parts" style={{ width: '100%', maxWidth: '400px' }} />
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <a href="/learn" className="button nav-protected">Start Learning</a>
        </div>
      </div>
    </>
  );
}
function RegisterPage() {
  const [activeTab, setActiveTab] = React.useState('register');
  const [registerMessage, setRegisterMessage] = React.useState('');
  const [loginMessage, setLoginMessage] = React.useState('');
  const [isRegisterError, setIsRegisterError] = React.useState(false);
  const [isLoginError, setIsLoginError] = React.useState(false);

  React.useEffect(() => {
    initializeCsvStore();
  }, []);

  function handleRegister(event) {
    event.preventDefault();
    setRegisterMessage('');

    const form = event.target;
    if (!form.checkValidity()) {
      setIsRegisterError(true);
      setRegisterMessage('Please fill all registration fields correctly.');
      return;
    }

    const user = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      password: form.password.value,
      course: form.course.value,
      location: form.location.value.trim(),
      registeredAt: new Date().toISOString()
    };

    upsertUserIntoCsv(user);
    setIsRegisterError(false);
    setRegisterMessage('Registration saved. Now login.');
    form.reset();
    setActiveTab('login');
  }

  function handleLogin(event) {
    event.preventDefault();
    setLoginMessage('');

    const form = event.target;
    if (!form.checkValidity()) {
      setIsLoginError(true);
      setLoginMessage('Enter email and password.');
      return;
    }

    const email = form.loginEmail.value.trim().toLowerCase();
    const password = form.loginPassword.value;
    const user = authenticateUser(email, password);
    if (!user) {
      setIsLoginError(true);
      setLoginMessage('Login failed. Check registered email/password.');
      return;
    }

    setSessionUser(user);
    setIsLoginError(false);
    setLoginMessage('Login successful. Redirecting...');

    const next = new URLSearchParams(window.location.search).get('next') || '/learn';
    window.setTimeout(() => {
      window.location.href = next;
    }, 500);
  }

  return (
    <>
      <Navbar />
      <div className="hero">
        <div className="container">
          <h1>Student Access Portal</h1>
          <p>Register or login to get started</p>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <div className="tab-buttons">
            <button
              type="button"
              className={`button tab-button ${activeTab === 'register' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
            <button
              type="button"
              className={`button tab-button ${activeTab === 'login' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
          </div>

          {activeTab === 'register' && (
            <form id="registerForm" onSubmit={handleRegister} noValidate autoComplete="on">
              <h2>Create Account</h2>
              <label htmlFor="fullName">Full Name:</label>
              <input type="text" id="fullName" name="fullName" placeholder="Enter your full name" autoComplete="name" required />

              <label htmlFor="email">Email Address:</label>
              <input type="email" id="email" name="email" placeholder="student@example.com" autoComplete="email" required />

              <label htmlFor="password">Password:</label>
              <input type="password" id="password" name="password" placeholder="Create a password" autoComplete="new-password" required />

              <label htmlFor="course">Course Selection:</label>
              <select id="course" name="course" required>
                <option value="">Select Course</option>
                <option value="mobile">Inner workings of mobile</option>
                <option value="tv">Inner workings of television</option>
                <option value="both">Inner workings of mobile and television</option>
              </select>

              <label htmlFor="location">Location:</label>
              <input type="text" id="location" name="location" placeholder="City/State" autoComplete="address-level2" required />

              <button type="submit" className="button" style={{ width: '100%' }}>Complete Registration</button>
              {registerMessage && (
                <p id="registerMessage" className={isRegisterError ? 'status-error' : 'status-success'} role="status" aria-live="polite">
                  {registerMessage}
                </p>
              )}
            </form>
          )}

          {activeTab === 'login' && (
            <form id="loginForm" onSubmit={handleLogin} noValidate autoComplete="on">
              <h2>Login</h2>
              <label htmlFor="loginEmail">Email Address:</label>
              <input type="email" id="loginEmail" name="loginEmail" placeholder="student@example.com" autoComplete="username" required />

              <label htmlFor="loginPassword">Password:</label>
              <input type="password" id="loginPassword" name="loginPassword" placeholder="Enter your password" autoComplete="current-password" required />

              <button type="submit" className="button" style={{ width: '100%' }}>Login</button>
              {loginMessage && (
                <p id="loginMessage" className={isLoginError ? 'status-error' : 'status-success'} role="status" aria-live="polite">
                  {loginMessage}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}
function LearnPage() {
  const user = getSessionUser();

  React.useEffect(() => {
    if (!user) {
      window.location.href = '/register?next=/learn';
      return;
    }
    const banner = document.getElementById('welcomeBanner');
    if (banner) {
      banner.textContent = `Welcome ${user.fullName}. Your course: ${formatCourse(user.course)}.`;
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const showTv = user.course === 'tv' || user.course === 'both';
  const showMobile = user.course === 'mobile' || user.course === 'both';
  const showBoth = user.course === 'both';

  return (
    <>
      <Navbar />
      <div className="hero">
        <h1>Complete Learning Modules</h1>
        <p>Detailed TV and mobile internal parts</p>
        <p id="welcomeBanner" role="status" aria-live="polite"></p>
      </div>

      <div className="container">
        {showTv && (
          <div className="card" id="tvSection">
            <h2>Inner workings of television</h2>
            <p>This course explains how a modern TV receives input, processes video and audio, and safely powers the panel.</p>
            <h3>Module 1: Safety, ESD, and Capacitors</h3>
            <p>Learn safe disassembly from the first screw. You will map which sections are live, which are isolated, and where high voltage can remain even after the TV is unplugged. We cover ESD basics, how to ground yourself correctly, and why some boards need isolation before probing. You will read safety markings, identify fuses and protection parts, and learn why random probing can damage a panel or the main board.</p>
            <p>You will also build a safe workflow: power down, wait, verify discharge, and only then measure. We explain capacitor discharge behavior, what tools are safe to use, and how to avoid shorting adjacent pads. By the end, you will know how to set up a clean workspace, avoid static damage, and take measurements without risking the board or yourself.</p>
            <p>You will finish with a practical safety checklist that includes isolation transformer usage, safe meter ranges, and labeling before you disconnect anything. We also cover how to recognize brittle connectors and when to stop before damage escalates. The goal is to make safety a repeatable habit, not a one time warning, so every session starts with the same controlled, low risk setup.</p>
            <h3>Module 2: Power Supply and Standby Rails</h3>
            <p>This module breaks down the TV power board into stages: AC input, rectification, PFC, primary switching, and secondary rails. You will trace how standby voltage stays active and how the main board requests full power. We show how rails rise in sequence and how the enable signals coordinate backlight and audio startup.</p>
            <p>You will learn to measure rail health and ripple, interpret normal ranges, and recognize symptoms of weak or unstable power. We cover common faults like blown fuses, shorted diodes, and bad capacitors. By comparing standby and main rails, you will decide whether a failure is on the power board, the main board, or downstream circuits.</p>
            <p>We also show how to use standby voltage as a diagnostic anchor even when the TV appears dead. You will learn when to disconnect downstream boards to confirm a short, and how to interpret a rail that collapses under load. These steps reduce unnecessary board swaps and help you isolate the failure to a single stage of the power system.</p>
            <h3>Module 3: Main Board and Firmware</h3>
            <p>Focus on the main board architecture: SoC, memory, tuner interface, and display output. You will follow the boot sequence from ROM to firmware, understand where settings are stored, and see how corruption can cause boot loops, missing inputs, or stuck logos. We also explain how the main board negotiates with the panel and the backlight system.</p>
            <p>You will practice confirming main board health before replacing it. That includes verifying local regulators, checking for shorted rails, and inspecting firmware storage. We explain when a service menu check is safe, when a firmware update is justified, and how to distinguish a firmware issue from a hardware failure that only looks like software.</p>
            <p>You will also learn how to compare firmware versions, check option bytes or region settings, and recognize when a board is mismatched to the panel. We discuss EEPROM corruption and why a board can boot but still fail to display. These checks help you decide between firmware repair, board replacement, or a panel compatibility issue.</p>
            <h3>Module 4: T-CON and Panel Timing</h3>
            <p>The T-CON is the timing brain for the panel. This module explains how LVDS or eDP signals arrive from the main board and are translated into row and column drive signals. You will learn how timing errors create lines, flicker, or color shifts, and how gate and source drivers depend on stable voltages.</p>
            <p>We show you how to identify T-CON related faults versus panel failures. You will practice cable inspection, safe reseating, and interpreting visual artifacts that point to a timing issue rather than a backlight problem. This section also covers when a panel issue is likely and how to avoid damaging fragile ribbon cables.</p>
            <p>We include guidance on safe voltage checks for VGH, VGL, and gamma references, and what out of range values imply. You will learn when a T-CON replacement is reasonable and when the panel itself is the likely failure point. This reduces the risk of replacing the wrong part and wasting time on a non recoverable panel.</p>
            <h3>Module 5: Backlight Systems</h3>
            <p>Backlight systems rely on LED strings, current regulation, and protection logic. You will learn how LED drivers sense open and short conditions, how dimming is controlled, and why some TVs show audio with a black screen. We break down common driver topologies and what each protection signal means.</p>
            <p>You will practice distinguishing no image from no backlight using safe testing. We discuss LED string testing, identifying a single failed diode in a chain, and avoiding overdriving the panel. By the end, you will know when to suspect the driver board, the LED strips, or a control signal from the main board.</p>
            <p>We also discuss brightness uniformity and aging, showing how uneven illumination can indicate failing strips before total blackout. You will learn how to balance replacement decisions with cost and risk to the panel. These steps help you plan a repair that is both reliable and cost effective for the customer.</p>
            <h3>Module 6: Audio Chain</h3>
            <p>Audio travels from the SoC through a codec and amplifier to speakers. This module covers analog and digital paths, including I2S routing, mute lines, and amplifier enable signals. You will learn how volume control works at the firmware level and how protection circuits shut down the amplifier when loads are unsafe.</p>
            <p>You will practice isolating no sound issues by testing speaker impedance, checking amplifier supply rails, and verifying the audio signal path. We cover common faults like distorted output, crackling, or silent channels. You will learn quick checks that separate speaker damage from amplifier or firmware issues.</p>
            <p>You will use a simple test tone workflow to confirm channel balance and verify that firmware is not muting output. We also cover how headphone and ARC paths interact with speakers. These checks let you pinpoint whether the issue is in the amp, the speaker load, or a settings path that can be fixed without hardware changes.</p>
            <h3>Module 7: Inputs and HDMI Handshake</h3>
            <p>Inputs are more than physical ports. You will learn how HDMI uses EDID to identify display capabilities and how HDCP protects content. This module explains why a TV can show a menu but not a source, and how the scaler and input switch process signals before they reach the panel.</p>
            <p>You will troubleshoot input failures using known good sources and cables, check for port damage, and validate handshake steps. We explain symptoms of a failing HDMI port, a damaged switch IC, and a bad EDID. By the end, you will know how to isolate the input stage without guessing.</p>
            <p>We also cover ARC and CEC behavior and why they can interfere with audio or source detection. You will learn how to reset handshake states and verify compatibility with older devices. This helps you close the loop on input repairs and confirm that a port level fix truly restored full functionality.</p>
            <h3>Module 8: Thermal Management and Preventive Care</h3>
            <p>Heat is a silent killer in TVs. This module covers heat sink placement, airflow paths, and the role of thermal pads or paste. You will learn which chips run hottest, how temperature affects stability, and why heat causes intermittent failures long before total breakdown.</p>
            <p>You will practice inspection and preventive maintenance: cleaning dust, verifying fanless airflow, and checking for heat discoloration. We discuss when to replace thermal pads, how to avoid blocking vents, and how to advise users on safe placement. The goal is to reduce repeat failures and extend device life.</p>
            <p>We finish with practical guidance on placement, ventilation clearance, and safe operating temperatures. You will learn how to recognize long term heat stress on boards and when to recommend changes in setup rather than replacement. This module encourages repairs that last by reducing the environmental causes of repeated failures.</p>
            <h3>Hands-On Practice</h3>
            <ul>
              <li>Identify test points on the power board and verify standby rails</li>
              <li>Trace a no-backlight symptom to the correct circuit block</li>
              <li>Validate HDMI handshake and isolate the failing stage</li>
            </ul>
            <div className="media-grid">
              <video className="learn-media" controls preload="metadata" poster="/tv.jpg">
                <source src="/tv.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {showMobile && (
          <div className="card" id="mobileSection">
            <h2>Inner workings of mobile</h2>
            <p>This course covers smartphone architecture, boot flow, power management, and RF connectivity.</p>
            <h3>Module 1: Board Layout and Component Identification</h3>
            <p>This module teaches you how to read a smartphone board like a map. You will identify shields, connectors, ground points, and high risk areas near power and RF sections. We explain labeling conventions, how to spot key chips, and how to find test points without removing unnecessary parts.</p>
            <p>You will also learn how to create a simple board reference so you can navigate faster during troubleshooting. We show how to trace a line from connector to IC, how to recognize common package types, and how to avoid accidental shorts while probing dense components.</p>
            <p>You will also practice documenting board layouts with quick photos and notes so you can reassemble without confusion. We explain how to keep track of screws, shields, and flex cables and why proper documentation reduces accidental damage. These habits speed up future diagnostics and keep devices organized throughout repair.</p>
            <h3>Module 2: SoC, RAM, and Storage</h3>
            <p>You will study how the SoC connects to RAM and storage and why those paths are critical to boot stability. This module explains the difference between UFS and eMMC, how each handles errors, and why slow or corrupt storage can cause freezes, boot loops, or missing data.</p>
            <p>We also cover how to recognize memory related failures in the field. You will learn symptoms that point to RAM instability versus storage corruption, and how to confirm the difference using boot behavior and current draw. This helps avoid replacing the wrong parts when software updates cannot resolve the issue.</p>
            <p>We also discuss recovery options and the limits of reflow or reballing when memory paths fail. You will learn how heat and flex stress can lead to intermittent faults, and why some repairs are not stable long term. This section helps you decide when to attempt deeper work and when to recommend data backup and replacement.</p>
            <h3>Module 3: Power Rails and Charging Path</h3>
            <p>Power management is the heart of smartphone repair. You will map the PMIC, understand rail sequencing, and see how the charging IC negotiates with USB C sources. We cover battery protection, temperature sensing, and how unstable rails can prevent boot even when the battery is healthy.</p>
            <p>You will learn to interpret current draw profiles and recognize patterns like hard shorts, boot loops, or stalled startup. We show how to test the charging path safely, including connector health, cable quality, and power negotiation. This module builds the foundation for diagnosing no power and slow charging cases.</p>
            <p>We include practical checks for USB port wear, flex cable damage, and charger compatibility. You will learn how to separate a weak charging source from a phone side fault and how to confirm battery health. These steps reduce false diagnoses and make power troubleshooting faster and more reliable.</p>
            <h3>Module 4: Display and Touch Systems</h3>
            <p>This module explains how display data and touch sensing work together. You will review MIPI DSI signaling, backlight or OLED power control, and the role of the touch controller. We show how panel types differ and why the same symptom can have different root causes.</p>
            <p>You will practice isolating display faults from touch faults by checking connectors, flex cables, and control signals. We also cover common failure patterns like lines, flicker, ghost touch, or no touch with visible image. By the end, you can separate a screen issue from a board issue with confidence.</p>
            <p>We also cover touch calibration and how software settings can affect responsiveness. You will learn how adhesive pressure, frame alignment, and flex cable tension can cause intermittent touch issues. These details help you verify the repair after reassembly and prevent a screen from failing again due to mechanical stress.</p>
            <h3>Module 5: Audio Subsystem</h3>
            <p>Audio issues often appear as no mic, no speaker, or distorted output. This module covers codec routing, mic bias, speaker amplification, and headset detection. You will learn how audio paths are switched between speakers, earpiece, and accessories, and how firmware controls those paths.</p>
            <p>You will practice verifying mic bias voltage, checking speaker impedance, and determining if the failure is hardware or settings. We also discuss moisture damage and how it affects small audio components. These checks help you avoid unnecessary board replacement when a simple part or setting is the real cause.</p>
            <p>We show how to clean speaker meshes and check for blocked sound paths that mimic hardware failure. You will also learn when a software update or reset can restore audio routing. By combining hardware and software checks, you can solve more audio problems without unnecessary parts replacement.</p>
            <h3>Module 6: RF Chain and Baseband</h3>
            <p>The RF chain includes the baseband, filters, switches, power amplifiers, and antenna connections. You will learn how signals move from the SIM interface to the antenna and where failures cause no service, weak signal, or dropouts. This module also explains why small connector issues can look like major board faults.</p>
            <p>You will practice inspecting antenna contacts, checking coax paths, and validating SIM reader health. We cover how to separate software or carrier issues from true hardware RF problems. With these steps, you can confirm RF faults before deciding on board replacement or advanced rework.</p>
            <p>We also explain antenna tuning and why small changes in housing or adhesives can affect signal quality. You will learn how to compare signal strength before and after repair and how to spot baseband resets or firmware faults. These checks improve confidence that the RF path is truly stable.</p>
            <h3>Module 7: Sensors and Thermal Control</h3>
            <p>Smartphones depend on sensors for stability and safety. This module covers sensor buses, calibration, and how faulty readings affect system behavior. You will learn how proximity, gyro, and thermal sensors report data and how missing sensors can trigger shutdowns or performance limits.</p>
            <p>We explain thermal throttling in detail and how it can mimic software lag. You will practice checking sensor connections, identifying corrupted sensor data, and confirming thermal shutdown causes. This helps you avoid misdiagnosing a thermal issue as a battery or CPU failure.</p>
            <p>We cover sensor recalibration after screen or board replacement and how to validate readings quickly. You will learn why poor thermal transfer between the SoC and heat spreader can lead to rapid throttling. These steps ensure the phone behaves normally after repair and does not overheat during daily use.</p>
            <h3>Module 8: Fault Isolation Workflow</h3>
            <p>Here you build a repeatable diagnostic workflow. Start with visual inspection, move to power checks, and then test key subsystems in a structured order. We emphasize non invasive steps first so you avoid creating new faults. You will learn how to keep the process fast without skipping critical checks.</p>
            <p>You will use a decision tree to document symptoms, measurements, and results. This module shows how to conclude whether a problem is software, board, or component level. By the end, you will produce a clear repair plan and know when a device is not cost effective to fix.</p>
            <p>We also include guidance for estimating repair cost and communicating risk to users. You will learn how to prioritize essential tests when time is limited and how to document your work clearly. This ensures each repair decision is transparent, repeatable, and easy to defend if the device returns later.</p>
            <h3>Hands-On Practice</h3>
            <ul>
              <li>Measure boot current draw and interpret the profile</li>
              <li>Verify charging negotiation and battery safety circuits</li>
              <li>Trace a no network issue to the RF block</li>
            </ul>
            <div className="media-grid">
              <video className="learn-media" controls preload="metadata" poster="/mobile.jpg">
                <source src="/mobile.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {showBoth && (
          <div className="card" id="bothSection">
            <h2>Inner workings of mobile and television</h2>
            <p>This course compares shared electronics principles and builds a transferable troubleshooting workflow.</p>
            <h3>Module 1: Architecture Mapping</h3>
            <p>This module compares how TVs and phones are built from similar blocks: power management, processing, display control, and I O. You will learn to map each block across devices and understand how shared concepts make troubleshooting transferable. We focus on recognizing patterns that stay the same even when the hardware looks different.</p>
            <p>You will practice translating a fault in one device type to an equivalent block in the other. This builds speed and confidence when you face unfamiliar boards. By the end, you can read a block diagram and quickly identify where to start testing regardless of the device category.</p>
            <p>We also map common test points and discuss how to confirm each block is alive before moving on. You will learn how to compare voltage rails and signal flow across devices, so a successful check on one platform informs the next. This builds a shared language for troubleshooting that saves time and reduces confusion.</p>
            <h3>Module 2: Power Sequencing and Protection</h3>
            <p>This module contrasts AC based and battery based power systems. You will learn how enable signals, reset lines, and protection circuits control startup. We explain how devices fail when a rail is missing or a protection circuit trips, and how that looks in startup behavior and current draw.</p>
            <p>You will practice reading timing order and identifying the point of failure. We show how to tell if a device dies before enable, during enable, or after load. This lets you focus on the correct block instead of chasing symptoms across the entire board.</p>
            <p>We add examples of how to use a bench power supply to observe a startup curve without the original power source. You will learn how to recognize protection triggers, like overcurrent or overvoltage, and how they present in both device types. This gives you a consistent method to spot early failure points.</p>
            <h3>Module 3: Display Pipelines</h3>
            <p>Display pipelines differ in scale but share similar timing and control concepts. You will compare T CON timing with mobile display drivers, and see how signal bandwidth, cable integrity, and connector health affect image quality. This module explains why display issues can be intermittent and why some appear only at certain resolutions or refresh rates.</p>
            <p>You will learn how to interpret artifacts like lines, flicker, or color shifts across both platforms. We discuss how to test for signal loss versus panel failure and how to confirm whether the source, driver, or panel is at fault. This gives you a consistent approach to display troubleshooting.</p>
            <p>We also discuss how to use a known good panel or board to validate a suspected failure. You will learn when substitution testing is safe and when it can damage a working panel. These decision rules reduce risk and make display diagnosis more reliable across both platforms.</p>
            <h3>Module 4: Audio and Codec Differences</h3>
            <p>Here we compare audio design in TVs and phones. You will study how codecs route signals, how amplifiers are protected, and how speaker loads differ. This section explains why a TV can lose sound while a phone has weak volume, and what each symptom tells you about the signal path.</p>
            <p>You will practice quick tests that confirm audio integrity, such as checking enable lines, verifying speaker loads, and tracing signal presence. We also show how firmware can mute audio without hardware failure. The goal is to avoid replacing boards when a simple routing or settings issue is the root cause.</p>
            <p>We include a short checklist for audio verification, including test tones, load checks, and route confirmation. You will learn how to compare expected amplifier behavior between TVs and phones so you can spot abnormal protection states quickly. This makes audio diagnosis consistent even when hardware layouts differ.</p>
            <h3>Module 5: Connectivity Paths</h3>
            <p>Connectivity looks different but the logic is similar. You will compare RF front end paths in phones with TV tuner or network modules. We map the path from antenna or network input to the processing block and show where failures commonly occur in connectors, modules, or firmware.</p>
            <p>You will practice shared troubleshooting steps such as verifying input integrity, checking module power, and confirming firmware communication. This helps you quickly decide if the fault is external, internal, or configuration based. The same structured checks work across both device categories.</p>
            <p>We also cover firmware and configuration factors that can block connectivity even when hardware is fine. You will learn to verify module power, communication lines, and configuration states before replacement. This approach avoids unnecessary swaps and keeps troubleshooting grounded in evidence.</p>
            <h3>Module 6: Test Equipment Strategy</h3>
            <p>Effective troubleshooting depends on choosing the right tool. You will compare multimeter checks, bench power supply profiling, and basic signal tracing. This module explains what each tool can and cannot tell you, and how to use them without harming sensitive circuits.</p>
            <p>You will learn to set safe current limits, interpret current draw patterns, and decide when deeper analysis is needed. We also cover safe probing techniques and how to avoid shorts on dense boards. By the end, you can select the fastest test that still provides reliable answers.</p>
            <p>We add guidance on when an oscilloscope or logic probe provides value versus when a multimeter is sufficient. You will learn how to keep measurement setups safe and stable, especially around high frequency lines. This module helps you choose the least invasive test that still provides decisive information.</p>
            <h3>Module 7: Symptom Trees and Workflow</h3>
            <p>A symptom tree turns guesswork into a repeatable process. You will learn how to group symptoms, order tests, and record results in a way that leads to clear conclusions. This module shows how to build trees that handle no power, no display, no sound, and intermittent behavior across devices.</p>
            <p>You will practice verifying a fix, re testing after repair, and documenting what changed. We also cover how to avoid confirmation bias by checking alternative causes. The result is a workflow that improves accuracy and reduces return visits.</p>
            <p>We finish by showing how to update your symptom tree after each repair so the process improves over time. You will learn how to track repeat failures and adjust the workflow to prevent them. This makes your diagnostics more accurate with every device you service.</p>
            <h3>Hands-On Practice</h3>
            <ul>
              <li>Build a shared checklist for no display failures</li>
              <li>Compare two repair plans and choose the safest option</li>
              <li>Document a complete diagnosis report with evidence</li>
            </ul>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <a href="/assessment" className="button">Ready for Assessment</a>
        </div>
      </div>
    </>
  );
}
function AssessmentPage() {
  const user = getSessionUser();
  const course = user ? user.course : '';

  const visibleQuestions = React.useMemo(() => {
    if (!course) return [];
    if (course === 'both') return QUESTIONS;
    return QUESTIONS.filter((q) => q.course === course);
  }, [course]);

  const [answers, setAnswers] = React.useState({});
  const [result, setResult] = React.useState({ message: '', isError: false });
  const [wrongMap, setWrongMap] = React.useState({});

  React.useEffect(() => {
    if (!user) {
      window.location.href = '/register?next=/assessment';
      return;
    }
    const intro = document.getElementById('assessmentIntro');
    if (intro && course) {
      intro.textContent = `Assessment loaded for: ${formatCourse(course)}.`;
    }
  }, [user, course]);

  function handleChange(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    for (let i = 0; i < visibleQuestions.length; i += 1) {
      if (!answers[visibleQuestions[i].id]) {
        setResult({ message: 'Please answer all visible questions before submitting.', isError: true });
        return;
      }
    }

    let score = 0;
    const nextWrong = {};

    visibleQuestions.forEach((question) => {
      const selected = answers[question.id];
      const correct = question.options.find((option) => option.correct);
      if (correct && selected === correct.value) {
        score += 1;
      } else if (correct) {
        nextWrong[question.id] = correct.label;
      }
    });

    const passed = score === visibleQuestions.length;
    setWrongMap(nextWrong);
    setResult({
      message: `Score: ${score} / ${visibleQuestions.length}${passed ? ' - Excellent.' : ' - Review and try again.'}`,
      isError: !passed
    });

    const attempts = loadList(STORAGE_KEYS.assessmentList);
    attempts.push({
      email: user ? user.email : '',
      course: course,
      score: score,
      total: visibleQuestions.length,
      submittedAt: new Date().toISOString()
    });
    saveList(STORAGE_KEYS.assessmentList, attempts);
  }

  if (!course) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="hero">
        <h1>Course Assessment</h1>
        <p id="assessmentIntro">Answer the questions for your selected course.</p>
      </div>

      <div className="container">
        <form id="quizForm" onSubmit={handleSubmit}>
          {visibleQuestions.map((question, index) => (
            <div className="quiz-question" key={question.id}>
              <h3>{index + 1}. {question.text}</h3>
              {question.options.map((option) => (
                <React.Fragment key={option.value}>
                  <label>
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={answers[question.id] === option.value}
                      onChange={() => handleChange(question.id, option.value)}
                    />
                    {option.label}
                  </label>
                  <br />
                </React.Fragment>
              ))}
              {wrongMap[question.id] && (
                <p className="status-error">Correct answer: {wrongMap[question.id]}</p>
              )}
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button type="submit" className="button">Submit Quiz</button>
          </div>
          {result.message && (
            <p id="quizResult" className={result.isError ? 'status-error' : 'status-success'} role="status" aria-live="polite">
              {result.message}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
function AdminPage() {
  const [stage, setStage] = React.useState('login');
  const [error, setError] = React.useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const password = event.target.adminPassword.value;
    if (password !== 'admin') {
      setError('Wrong admin password.');
      return;
    }
    setError('');
    setStage('view');
  }

  if (stage === 'login') {
    return (
      <>
        <Navbar />
        <div className="hero">
          <h1>Admin Login</h1>
          <p>Enter the admin password to view data.</p>
        </div>
        <div className="container">
          <div className="card">
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="adminPassword">Admin Password:</label>
              <input type="password" id="adminPassword" name="adminPassword" required />
              <button type="submit" className="button" style={{ width: '100%' }}>Enter</button>
              {error && <p className="status-error" role="status" aria-live="polite">{error}</p>}
            </form>
          </div>
        </div>
      </>
    );
  }

  const users = parseUsersCsv(localStorage.getItem(STORAGE_KEYS.usersCsv));
  const feedback = loadList(STORAGE_KEYS.feedbackList);
  const contacts = loadList(STORAGE_KEYS.contactList);
  const assessments = loadList(STORAGE_KEYS.assessmentList);

  return (
    <>
      <Navbar />
      <div className="hero">
        <h1>Admin Dashboard</h1>
        <p>Simple CSV view for users, feedback, contact messages, and assessment attempts.</p>
      </div>

      <div className="container">
        <div className="card">
          <h2>Registered Users</h2>
          {users.length > 0 ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Location</th>
                    <th>Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row, index) => (
                    <tr key={`${row.email}-${index}`}>
                      <td>{row.fullName}</td>
                      <td>{row.email}</td>
                      <td>{row.course}</td>
                      <td>{row.location}</td>
                      <td>{row.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No users found yet.</p>
          )}
        </div>

        <div className="card">
          <h2>Feedback Submissions</h2>
          {feedback.length > 0 ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Learned</th>
                    <th>Suggestions</th>
                    <th>Rating</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((row, index) => (
                    <tr key={`${row.email}-${index}`}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.learned}</td>
                      <td>{row.suggestions}</td>
                      <td>{row.rating}</td>
                      <td>{row.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No feedback found yet.</p>
          )}
        </div>

        <div className="card">
          <h2>Contact Messages</h2>
          {contacts.length > 0 ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((row, index) => (
                    <tr key={`${row.email}-${index}`}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.subject}</td>
                      <td>{row.message}</td>
                      <td>{row.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No contact messages found yet.</p>
          )}
        </div>

        <div className="card">
          <h2>Assessment Attempts</h2>
          {assessments.length > 0 ? (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Score</th>
                    <th>Total</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((row, index) => (
                    <tr key={`${row.email}-${index}`}>
                      <td>{row.email}</td>
                      <td>{row.course}</td>
                      <td>{row.score}</td>
                      <td>{row.total}</td>
                      <td>{row.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No assessments found yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
