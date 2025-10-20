import { ResourceVector } from "../utils/ResourceVector.js";
import { Upgrade } from "../utils/Upgrade.js";
import { GameState } from "../GameState.js";
import { Game } from "../Game.js";

export class ResourceManager {
  gameState: GameState;

  constructor() {
    const gameState = GameState.initial();
    this.gameState = gameState;
  }

  applyClick(timePassed: ResourceVector) {
    this.gameState.resources = this.gameState.resources
      .add(this.gameState.clickPower)
      .add(this.gameState.resourcesPerSecond.vectorMul(timePassed));
  }

  applyUpgrade(upgrade: Upgrade) {
    this.gameState.resources = this.gameState.resources.add(upgrade.resources);
    this.gameState.storages = this.gameState.storages.add(upgrade.storages);
    this.gameState.resourcesPerSecond = this.gameState.resourcesPerSecond.add(
      upgrade.resourcePerSecond
    );
    this.gameState.clickPower = this.gameState.clickPower.add(
      upgrade.clickPower
    );
  }

  getAllResources() {
    return [
      this.gameState.resources,
      this.gameState.clickPower,
      this.gameState.storages,
      this.gameState.resourcesPerSecond,
      this.gameState.lastClaimTime,
    ];
  }

  equalsOnchain(game: Game) {
    const gameState = game.gameStateCommit.get();

    return this.gameState.getCommit().equals(gameState);
  }
}
