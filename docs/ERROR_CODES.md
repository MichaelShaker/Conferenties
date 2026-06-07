# Foutcodes

De API geeft bij fouten altijd deze vorm terug:

```json
{
  "success": false,
  "code": "AUTH_SESSION_EXPIRED",
  "message": "Je sessie is verlopen.",
  "description": "Dat gebeurt soms als je lang niets hebt gedaan of opnieuw bent ingelogd op een ander apparaat.",
  "action": "Log opnieuw in en probeer het daarna nog een keer."
}
```

De website toont de melding, uitleg, herstelactie en foutcode aan de gebruiker.

## Account en login

| Code | Betekenis | Wat gebruiker moet doen |
| --- | --- | --- |
| `LOGIN_REQUIRED_FIELDS` | E-mail of wachtwoord ontbreekt. | E-mailadres en wachtwoord invullen. |
| `LOGIN_INVALID_CREDENTIALS` | E-mail/wachtwoord klopt niet. | Gegevens controleren of wachtwoord vergeten gebruiken. |
| `AUTH_LOGIN_REQUIRED` | Gebruiker is niet ingelogd. | Inloggen en opnieuw proberen. |
| `AUTH_SESSION_EXPIRED` | Sessie is verlopen of token is ongeldig. | Opnieuw inloggen. |
| `AUTH_SESSION_INVALID` | Login mist accountgegevens. | Uitloggen, opnieuw inloggen en opnieuw proberen. |
| `ACCOUNT_EMAIL_EXISTS` | E-mailadres is al geregistreerd. | Inloggen of wachtwoord vergeten gebruiken. |

## Wachtwoord reset

| Code | Betekenis | Wat gebruiker moet doen |
| --- | --- | --- |
| `PASSWORD_RESET_EMAIL_REQUIRED` | E-mailadres ontbreekt. | E-mailadres invullen. |
| `PASSWORD_RESET_LINK_EXPIRED` | Resetlink is verlopen of ongeldig. | Nieuwe resetlink aanvragen. |
| `PASSWORD_REQUIRED` | Nieuw wachtwoord ontbreekt. | Nieuw wachtwoord invullen. |

## Events en registraties

| Code | Betekenis | Wat gebruiker moet doen |
| --- | --- | --- |
| `EVENT_NOT_FOUND` | Event bestaat niet of link klopt niet meer. | Terug naar eventoverzicht en opnieuw kiezen. |
| `EVENT_REQUIRED_FIELDS` | Verplichte eventgegevens ontbreken. | Verplichte velden invullen. |
| `EVENT_END_BEFORE_START` | Einddatum ligt voor startdatum. | Einddatum aanpassen. |
| `REGISTRATION_ALREADY_EXISTS` | Gebruiker is al ingeschreven. | Inschrijving bekijken bij Mijn registraties. |
| `REGISTRATION_EVENT_FULL` | Event zit vol. | Ander event kiezen of organisatie contacteren. |
| `REGISTRATION_DEADLINE_PASSED` | Inschrijfdeadline is voorbij. | Contact opnemen met organisatie als dit niet klopt. |
| `PAYMENT_PROOF_REQUIRED` | Betaalbewijs ontbreekt. | Betaalbewijs uploaden. |
| `PAYMENT_PROOF_INVALID_FILE` | Bestandstype of bestandsgrootte klopt niet. | PNG, JPG of WebP onder 2,5MB uploaden. |

## Beheer en Google

| Code | Betekenis | Wat gebruiker moet doen |
| --- | --- | --- |
| `ADMIN_ACCESS_REQUIRED` | Gebruiker heeft geen beheerrechten. | Inloggen als beheerder of hulp vragen. |
| `GOOGLE_SYNC_FAILED` | Google Sheet van een event kon niet worden bijgewerkt. | Herstel sync klikken; anders Google opnieuw verbinden. |
| `GOOGLE_SYNC_ALL_FAILED` | Meerdere Sheets konden niet worden bijgewerkt. | Fout per event bekijken en Google opnieuw verbinden. |
| `TOO_MANY_ATTEMPTS` | Te veel pogingen in korte tijd. | Een paar minuten wachten en opnieuw proberen. |
