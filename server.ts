import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/scan", async (req, res) => {
    const { city, category, companyName } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Clé API Google Maps manquante. Vérifiez l'onglet Secrets (GOOGLE_MAPS_API_KEY)." });
    }

    try {
      // 1. Search for places using the NEW Places API
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
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.location'
        },
        body: JSON.stringify({
          textQuery: textQuery
        })
      });

      const searchData = await searchResponse.json();

      if (searchData.error) {
        const error = searchData.error;
        console.error("Google Maps Search Error Full:", JSON.stringify(error, null, 2));
        
        let detailMsg = error.message || "Erreur inconnue";
        
        if (error.details) {
          const errorInfo = error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo');
          if (errorInfo) {
            detailMsg += ` (Raison: ${errorInfo.reason})`;
            if (errorInfo.reason === 'API_KEY_SERVICE_BLOCKED') {
              detailMsg = "L'API 'Places API (New)' n'est pas activée pour votre projet ou votre clé est restreinte. Activez-la dans la console Google Cloud.";
            }
          }
        }

        return res.status(400).json({ 
          error: `Erreur Google Maps: ${detailMsg}` 
        });
      }

      if (!searchData.places || searchData.places.length === 0) {
        return res.json([]);
      }

      const results = searchData.places.map((place: any) => {
        const website = place.websiteUri || "";
        let opportunityScore = 0;

        if (!website) {
          opportunityScore = 10; // High priority (no site = bad health)
        } else if (website.startsWith("http://")) {
          opportunityScore = 40; // Medium priority (unsecure)
        } else {
          opportunityScore = 70; // Low priority (secure site)
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
          opportunity_score: opportunityScore,
          tags: [],
          lat: place.location?.latitude,
          lng: place.location?.longitude,
          audit_json: JSON.stringify({
            has_website: !!website,
            is_secure: website.startsWith("https://"),
            last_scan: new Date().toISOString()
          })
        };
      });

      res.json(results);
    } catch (error) {
      console.error("Scan error:", error);
      res.status(500).json({ error: "Failed to scan" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
