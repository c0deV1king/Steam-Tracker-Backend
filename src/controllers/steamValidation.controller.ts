import { Request, Response, Router } from "express";
import axios from "axios";

export class steamValidationController {
  // this class is used to validate the steam openid response
  public route: Router;

  constructor() {
    this.route = Router();
    this.initializeRoutes();
    console.log("Steam Validation Controller initialized");
  }

  private initializeRoutes() {
    this.route.get("/", async (req: Request, res: Response) => {
      console.log("Steam Validation Route Hit");
      try {
        console.log("Incoming Query Parameters:", req.query);
        const params = new URLSearchParams(req.query as any);
        const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

        const returnToUrl = `${backendUrl}/api/validate-steam/`;
        console.log("Return To URL:", returnToUrl);
        // Validate the Steam response
        const validationResponse = await axios.post(
          "https://steamcommunity.com/openid/login",
          new URLSearchParams({
            ...Object.fromEntries(params),
            "openid.mode": "check_authentication",
            "openid.return_to": returnToUrl,
          }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        const validationText = validationResponse.data;
        console.log("Validation Response:", validationText);

        if (validationText.includes("is_valid:true")) {
          const claimedId = params.get("openid.claimed_id");
          console.log("Claimed ID:", claimedId);
          if (claimedId) {
            const steamId = claimedId.split("/").pop();
            console.log("Extracted Steam ID:", steamId);

            const frontendUrl =
              process.env.FRONTEND_URL || "http://localhost:3001";
            console.log(
              "Redirecting to frontend URL:",
              `${frontendUrl}/?steamId=${steamId}`
            );
            res.redirect(`${frontendUrl}/?steamId=${steamId}`);
            console.log(
              "Redirecting to:",
              `${frontendUrl}/?steamId=${steamId}`
            );
          } else {
            console.log("Invalid claimed ID");
            res.redirect("/?error=invalid_claimed_id");
          }
        } else {
          console.log("Authentication failed");
          res.redirect("/?error=auth_failed");
        }
      } catch (error) {
        console.error("Error validating Steam OpenID:", error);
        res.redirect("/?error=server_error");
      }
    });
  }
}
