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
      try {
        const params = new URLSearchParams(req.query as any);

        // Validate the Steam response
        const validationResponse = await axios.post(
          "https://steamcommunity.com/openid/login",
          new URLSearchParams({
            ...Object.fromEntries(params),
            "openid.mode": "check_authentication",
          }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        const validationText = validationResponse.data;

        if (validationText.includes("is_valid:true")) {
          const claimedId = params.get("openid.claimed_id");
          if (claimedId) {
            const steamId = claimedId.split("/").pop();
            res.redirect(`/?steamId=${steamId}`);
          } else {
            res.redirect("/?error=invalid_claimed_id");
          }
        } else {
          res.redirect("/?error=auth_failed");
        }
      } catch (error) {
        console.error("Error validating Steam OpenID:", error);
        res.redirect("/?error=server_error");
      }
    });
  }
}
