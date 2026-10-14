import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gameUrl } from "../utils/gameSession";

/**
 * Keeps the URL at `${basePath}/:id` in sync with the active game, e.g. after a
 * rematch or when opening the bare `${basePath}` route.
 */
export const useGameSessionRoute = (
  gameId: string | undefined,
  basePath: string
): void => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameId && id !== gameId) {
      navigate(gameUrl(basePath, gameId), { replace: true });
    }
  }, [gameId, id, basePath, navigate]);
};
