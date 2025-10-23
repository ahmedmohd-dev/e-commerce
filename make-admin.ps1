$body = @{
    uid = "zdrBoUTI0JcEEAjqLWNLwskqiuF3"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/_util/make-admin?secret=my-secret-key-123" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Success: $response"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}



