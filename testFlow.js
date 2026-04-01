const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); 
const nodeFetch = globalThis.fetch || fetch;

async function runTestFlow() {
    console.log('--- STARTING WEBHOOK INTEGRATION TEST ---');
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await nodeFetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '123456' })
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
        const token = loginData.token;
        console.log('   ✅ Logged in successfully. Token acquired.');

        console.log('\n2. Creating a new Task (Unassigned) -> Expected Webhook: [GREEN] New Task Created...');
        const taskRes = await nodeFetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                title: 'Test Webhook Flow Task',
                description: 'This is an automated test ensuring Discord webhooks fly upon task creation!',
                assigned_role_id: null,
                status: 'pending'
            })
        });
        const taskData = await taskRes.json();
        if (!taskRes.ok) throw new Error('Task creation failed: ' + JSON.stringify(taskData));
        const taskId = taskData.taskId;
        console.log(`   ✅ Task created successfully (ID: ${taskId}).`);
        console.log('   ⏳ Waiting 2 seconds for Webhook to finish firing...');
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n3. Changing Task status to Completed -> Expected Webhook: [GREEN] Task Completed...');
        const completeRes = await nodeFetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                status: 'completed'
            })
        });
        if (!completeRes.ok) throw new Error('Task complete failed: ' + await completeRes.text());
        console.log(`   ✅ Task successfully marked as Completed.`);
        console.log('   ⏳ Waiting 2 seconds for Webhook to finish firing...');
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n4. Toggling SOS Flag to ON -> Expected Webhook: [RED] SOS ALERT...');
        const sosRes = await nodeFetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                sos_flag: true
            })
        });
        if (!sosRes.ok) throw new Error('Task SOS trigger failed: ' + await sosRes.text());
        console.log(`   ✅ Task successfully flagged with SOS.`);
        console.log('   ⏳ Waiting 2 seconds for Webhook to finish firing...');
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n🎉 --- EVERYTHING FINISHED SUCCESSFULLY --- 🎉');
    } catch (e) {
        console.error('❌ Test flow failed:', e);
    }
}

runTestFlow();
