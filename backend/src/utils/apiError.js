const DEFAULT_ERROR_DETAILS = {
    BAD_REQUEST: {
        message: "Er ontbreekt informatie of er is iets verkeerd ingevuld.",
        description: "Controleer de ingevulde gegevens en probeer het opnieuw.",
        action: "Vul de verplichte velden aan en probeer opnieuw."
    },
    UNAUTHORIZED: {
        message: "Je bent niet meer ingelogd.",
        description: "Je sessie is verlopen of je bent op een ander apparaat uitgelogd.",
        action: "Log opnieuw in en probeer het daarna nog een keer."
    },
    FORBIDDEN: {
        message: "Je hebt geen toegang tot deze pagina of actie.",
        description: "Deze actie is alleen beschikbaar voor gebruikers met extra rechten.",
        action: "Vraag een beheerder om hulp als je denkt dat dit niet klopt."
    },
    NOT_FOUND: {
        message: "We konden dit onderdeel niet vinden.",
        description: "Het item is mogelijk verwijderd of de link klopt niet meer.",
        action: "Ga terug naar het overzicht en probeer het opnieuw."
    },
    CONFLICT: {
        message: "Deze actie kan niet dubbel worden uitgevoerd.",
        description: "Er bestaat al een registratie of account met dezelfde gegevens.",
        action: "Controleer je bestaande registratie of log in met je bestaande account."
    },
    RATE_LIMITED: {
        message: "Je hebt dit te vaak geprobeerd.",
        description: "Om misbruik te voorkomen is deze actie tijdelijk geblokkeerd.",
        action: "Wacht een paar minuten en probeer het daarna opnieuw."
    },
    SERVER_ERROR: {
        message: "Er ging iets mis aan onze kant.",
        description: "De server kon je verzoek niet verwerken.",
        action: "Probeer het later opnieuw. Blijft dit gebeuren, geef de foutcode door aan support."
    }
};

function sendError(res, status, code, overrides = {}) {
    const fallbackKey = status === 401
        ? "UNAUTHORIZED"
        : status === 403
            ? "FORBIDDEN"
            : status === 404
                ? "NOT_FOUND"
                : status === 409
                    ? "CONFLICT"
                    : status === 429
                        ? "RATE_LIMITED"
                        : status >= 500
                            ? "SERVER_ERROR"
                            : "BAD_REQUEST";
    const fallback = DEFAULT_ERROR_DETAILS[fallbackKey];

    return res.status(status).json({
        success: false,
        code,
        message: overrides.message || fallback.message,
        description: overrides.description || fallback.description,
        action: overrides.action || fallback.action
    });
}

module.exports = {
    sendError
};
