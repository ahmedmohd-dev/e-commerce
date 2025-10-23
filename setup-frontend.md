# Frontend Setup Instructions

## 1. Install Dependencies

```bash
cd client
npm install
```

## 2. Create Environment File

Create a file named `.env` in the `client` folder with the following content:

```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ
VITE_FIREBASE_AUTH_DOMAIN=ecommercemern-5437d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ecommercemern-5437d
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456789
```

**Important:** Replace the Firebase values with your actual Firebase project configuration from the Firebase Console.

## 3. Start the Frontend

```bash
npm run dev
```

## 4. Access the Application

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 5. Test the Flow

1. Open http://localhost:5173
2. Click "Login" and create an account or login
3. This will create your user record in the database
4. Then run the admin promotion command again:
   ```powershell
   $body = @{uid='zdrBoUTI0JcEEAjqLWNLwskqiuF3'} | ConvertTo-Json
   Invoke-RestMethod -Uri 'http://localhost:5000/api/_util/make-admin?secret=my-secret-key-123' -Method POST -Body $body -ContentType 'application/json'
   ```



