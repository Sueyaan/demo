const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
   
   
   fetch(`${API_URL}/auth/login`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password })
   })