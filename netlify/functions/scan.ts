import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { city, category, companyName } = JSON.parse(event.body || "{}");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Clé API Google Maps manquante. Vérifiez vos variables d'environnement Netlify (GOOGLE_MAPS_API_KEY)." }),
      };
    }

    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    
    let textQuery = "";
    if (companyName) {
      textQuery = companyName;
      if (city) textQuery += ` in ${city}`;
      if (category) textQuery += ` ${category}`;
    } else {
      textQuery = `${category} in ${city}`;
    }

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber'
      },
      body: JSON.stringify({
        textQuery: textQuery
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      return {
        statusCode: searchResponse.status,
        body: JSON.stringify({ error: `Erreur Google Maps (${searchResponse.status}): ${errorText.substring(0, 100)}` }),
      };
    }

    const searchData = await searchResponse.json();

    if (searchData.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Erreur Google Maps: ${searchData.error.message}` }),
      };
    }

    if (!searchData.places || searchData.places.length === 0) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    const results = searchData.places.map((place: any) => {
      const website = place.websiteUri || "";
      let digitalScore = 0;

      if (!website) {
        digitalScore = 10;
      } else if (website.startsWith("http://")) {
        digitalScore = 40;
      } else {
        digitalScore = 70;
      }

      return {
        id: place.id,
        name: place.displayName?.text || "Inconnu",
        address: place.formattedAddress || "",
        phone: place.nationalPhoneNumber || "",
        website: website,
        category: category,
        city: city,
        status: 'Nouveau',
        opportunity_score: digitalScore,
        tags: [],
        audit_json: JSON.stringify({
          has_website: !!website,
          is_secure: website.startsWith("https://"),
          last_scan: new Date().toISOString()
        })
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error: any) {
    console.error("Scan error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to scan" }),
    };
  }
};
