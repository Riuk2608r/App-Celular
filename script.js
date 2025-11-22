// ===== DATOS DE LA APLICACIÓN =====
let currentView = 'home';
let userType = 'patient';

let patients = [
    { id: 1, name: 'Juan Pérez', age: 65, relation: 'Titular' }
];

let selectedPatient = patients[0];

let medications = [
    {
        id: 1,
        patientId: 1,
        name: 'Enalapril',
        dose: '10mg',
        frequency: 'Cada 12 horas',
        times: ['08:00', '20:00'],
        duration: '30 días',
        startDate: '2025-11-01',
        instructions: 'Tomar con alimentos',
        history: [
            { date: '2025-11-21', time: '08:00', status: 'taken', timestamp: '2025-11-21T08:05:00' }
        ]
    },
    {
        id: 2,
        patientId: 1,
        name: 'Metformina',
        dose: '850mg',
        frequency: 'Cada 8 horas',
        times: ['08:00', '16:00', '00:00'],
        duration: '30 días',
        startDate: '2025-11-01',
        instructions: 'Tomar después de las comidas',
        history: []
    }
];

// ===== FUNCIONES DE NAVEGACIÓN =====
function showView(viewName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Mostrar vista seleccionada
    document.getElementById(viewName + 'View').classList.add('active');

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Actualizar FAB visibility
    const fab = document.getElementById('fabButton');
    if (viewName === 'home') {
        fab.style.display = 'flex';
    } else {
        fab.style.display = 'none';
    }

    // Actualizar contenido según la vista
    if (viewName === 'home') {
        updateHomeView();
    } else if (viewName === 'history') {
        updateHistoryView();
    } else if (viewName === 'patients') {
        updatePatientsView();
    }

    currentView = viewName;
}

function showPatientsView() {
    showView('patients');
}

// ===== FUNCIONES DE RECORDATORIOS =====
function generateReminders() {
    const today = new Date().toISOString().split('T')[0];
    const reminders = [];

    medications.forEach(med => {
        if (med.patientId === selectedPatient.id) {
            med.times.forEach(time => {
                const taken = med.history.find(h => 
                    h.date === today && h.time === time
                );

                const [hours, minutes] = time.split(':');
                const reminderTime = new Date();
                reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);

                reminders.push({
                    id: `${med.id}-${time}`,
                    medicationId: med.id,
                    medication: med.name,
                    dose: med.dose,
                    time: time,
                    status: taken ? taken.status : 'pending',
                    timestamp: reminderTime
                });
            });
        }
    });

    return reminders.sort((a, b) => a.timestamp - b.timestamp);
}

function markMedication(reminderId, status) {
    const reminderParts = reminderId.split('-');
    const medicationId = parseInt(reminderParts[0]);
    const time = reminderParts[1];
    const today = new Date().toISOString().split('T')[0];

    medications = medications.map(med => {
        if (med.id === medicationId) {
            // Eliminar registro existente del mismo día y hora
            const newHistory = med.history.filter(h => 
                !(h.date === today && h.time === time)
            );
            
            // Agregar nuevo registro
            newHistory.push({
                date: today,
                time: time,
                status: status,
                timestamp: new Date().toISOString()
            });

            return { ...med, history: newHistory };
        }
        return med;
    });

    updateHomeView();
}

function calculateAdherence() {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }

    let totalDoses = 0;
    let takenDoses = 0;

    medications.forEach(med => {
        if (med.patientId === selectedPatient.id) {
            last7Days.forEach(date => {
                totalDoses += med.times.length;
                const taken = med.history.filter(h => 
                    h.date === date && h.status === 'taken'
                ).length;
                takenDoses += taken;
            });
        }
    });

    return totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
}

// ===== ACTUALIZAR VISTAS =====
function updateHomeView() {
    // Actualizar paciente seleccionado
    document.getElementById('selectedPatientName').textContent = selectedPatient.name;
    document.getElementById('selectedPatientAge').textContent = `${selectedPatient.age} años`;

    // Actualizar estadísticas
    const adherence = calculateAdherence();
    const percentageEl = document.getElementById('adherencePercentage');
    const progressEl = document.getElementById('adherenceProgress');

    percentageEl.textContent = `${adherence}%`;
    progressEl.style.width = `${adherence}%`;

    // Aplicar clases de color
    percentageEl.className = 'stats-percentage ' + getAdherenceClass(adherence);
    progressEl.className = 'progress-fill ' + getAdherenceClass(adherence);

    // Actualizar recordatorios
    const reminders = generateReminders();
    const pendingCount = reminders.filter(r => r.status === 'pending').length;
    document.getElementById('pendingDoses').textContent = `${pendingCount} dosis pendientes hoy`;

    // Actualizar fecha actual
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('currentDate').textContent = 
        new Date().toLocaleDateString('es-PE', dateOptions);

    // Renderizar recordatorios
    const remindersList = document.getElementById('remindersList');
    
    if (reminders.length === 0) {
        remindersList.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>No hay medicamentos programados para hoy</p>
            </div>
        `;
    } else {
        remindersList.innerHTML = reminders.map(reminder => `
            <div class="reminder-card ${reminder.status}">
                <div class="reminder-info">
                    <div class="reminder-time">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${reminder.time}</span>
                    </div>
                    <h3 class="reminder-name">${reminder.medication}</h3>
                    <p class="reminder-dose">${reminder.dose}</p>
                </div>
                
                ${reminder.status === 'pending' ? `
                    <div class="reminder-actions">
                        <button class="action-btn btn-taken" onclick="markMedication('${reminder.id}', 'taken')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </button>
                        <button class="action-btn btn-missed" onclick="markMedication('${reminder.id}', 'missed')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </button>
                    </div>
                ` : reminder.status === 'taken' ? `
                    <div class="status-badge taken">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>Tomado</span>
                    </div>
                ` : `
                    <div class="status-badge missed">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span>Omitido</span>
                    </div>
                `}
            </div>
        `).join('');
    }
}

function updateHistoryView() {
    const patientMeds = medications.filter(m => m.patientId === selectedPatient.id);
    const historyList = document.getElementById('historyList');

    historyList.innerHTML = patientMeds.map(med => {
        const totalDoses = med.history.length;
        const takenDoses = med.history.filter(h => h.status === 'taken').length;
        const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

        return `
            <div class="history-card">
                <div class="history-header">
                    <div class="med-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                        </svg>
                    </div>
                    <div class="med-details">
                        <h3>${med.name}</h3>
                        <p>${med.dose} - ${med.frequency}</p>
                    </div>
                </div>

                <div class="history-stats">
                    <div class="stat-row">
                        <span class="stat-label">Adherencia</span>
                        <span class="stat-value ${getAdherenceClass(adherenceRate)}">${adherenceRate}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${getAdherenceClass(adherenceRate)}" style="width: ${adherenceRate}%"></div>
                    </div>
                    <p class="stats-info">${takenDoses} de ${totalDoses} dosis tomadas</p>
                </div>

                <div class="history-info">
                    <p class="info-item"><strong>Inicio:</strong> ${new Date(med.startDate).toLocaleDateString('es-PE')}</p>
                    <p class="info-item"><strong>Duración:</strong> ${med.duration}</p>
                    ${med.instructions ? `<p class="info-item"><strong>Instrucciones:</strong> ${med.instructions}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updatePatientsView() {
    const patientsList = document.getElementById('patientsList');

    patientsList.innerHTML = patients.map(patient => {
        const patientMeds = medications.filter(m => m.patientId === patient.id).length;
        const isSelected = selectedPatient.id === patient.id;

        return `
            <div class="patient-item ${isSelected ? 'selected' : ''}" onclick="selectPatient(${patient.id})">
                <div class="patient-item-info">
                    <div class="patient-item-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="patient-item-details">
                        <h3>${patient.name}</h3>
                        <p>${patient.age} años</p>
                        <p class="med-count">${patientMeds} medicamentos activos</p>
                    </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
        `;
    }).join('');
}

function selectPatient(patientId) {
    selectedPatient = patients.find(p => p.id === patientId);
    showView('home');
}

function getAdherenceClass(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
}

// ===== FUNCIONES DE MODALES =====
function showAddMedicationModal() {
    document.getElementById('addMedicationModal').classList.add('active');
}

function closeAddMedicationModal() {
    document.getElementById('addMedicationModal').classList.remove('active');
    document.getElementById('addMedicationForm').reset();
    // Resetear inputs de tiempo
    document.getElementById('timeInputs').innerHTML = '<input type="time" class="time-input" required>';
}

function showAddPatientModal() {
    document.getElementById('addPatientModal').classList.add('active');
}

function closeAddPatientModal() {
    document.getElementById('addPatientModal').classList.remove('active');
    document.getElementById('addPatientForm').reset();
}

function addTimeInput() {
    const timeInputs = document.getElementById('timeInputs');
    const newInput = document.createElement('input');
    newInput.type = 'time';
    newInput.className = 'time-input';
    newInput.required = true;
    timeInputs.appendChild(newInput);
}

function addMedication(event) {
    event.preventDefault();

    const timeInputs = document.querySelectorAll('.time-input');
    const times = Array.from(timeInputs).map(input => input.value).filter(v => v);

    const newMed = {
        id: Date.now(),
        patientId: selectedPatient.id,
        name: document.getElementById('medName').value,
        dose: document.getElementById('medDose').value,
        frequency: document.getElementById('medFrequency').value,
        times: times,
        duration: document.getElementById('medDuration').value,
        startDate: new Date().toISOString().split('T')[0],
        instructions: document.getElementById('medInstructions').value,
        history: []
    };

    medications.push(newMed);
    closeAddMedicationModal();
    updateHomeView();
}

function addPatient(event) {
    event.preventDefault();

    const newPatient = {
        id: Date.now(),
        name: document.getElementById('patientName').value,
        age: parseInt(document.getElementById('patientAge').value),
        relation: document.getElementById('patientRelation').value
    };

    patients.push(newPatient);
    closeAddPatientModal();
    updatePatientsView();
}

// ===== FUNCIONES DE CONFIGURACIÓN =====
function setUserType(type) {
    userType = type;
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
}

function toggleSetting(element) {
    element.classList.toggle('active');
}

function showNotifications() {
    alert('Función de notificaciones - En desarrollo');
}

// ===== CERRAR MODALES AL HACER CLIC FUERA =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    updateHomeView();
});