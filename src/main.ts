import { PixTelOpenWorldGame, type ModalId } from "./game";
import { ClassSelectUI } from "./ui/ClassSelect";
import { HudUI } from "./ui/HUD";
import { DialogueModalUI } from "./ui/DialogueModal";
import { InventoryModalUI } from "./ui/InventoryModal";
import { ForgeModalUI } from "./ui/ForgeModal";
import { WorldMapModalUI } from "./ui/WorldMapModal";
import { QuestJournalModalUI } from "./ui/QuestJournalModal";
import { ItemReviewTooltip } from "./ui/ItemReviewTooltip";
import { installRopeFrameAssets } from "./graphics/ropeFrame";
import { sfx } from "./audio/chiptuneSynth";

function bootstrap() {
  installRopeFrameAssets();
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const pauseModal = document.getElementById("modal-pause")!;
  const victoryModal = document.getElementById("modal-victory")!;

  let classSelect: ClassSelectUI;
  let hud: HudUI;
  let dialogue: DialogueModalUI;
  let inventory: InventoryModalUI;
  let forge: ForgeModalUI;
  let worldMap: WorldMapModalUI;
  let journal: QuestJournalModalUI;
  let itemTooltip: ItemReviewTooltip;

  const game = new PixTelOpenWorldGame(canvas, {
    onHudUpdate: () => hud?.update(),
    onToast: (msg, tone) => hud?.toast(msg, tone),
    onModalChange: (modal: ModalId, payload?: unknown) => {
      itemTooltip?.hide();
      classSelect?.hide();
      dialogue?.hide();
      inventory?.hide();
      forge?.hide();
      worldMap?.hide();
      journal?.hide();
      pauseModal.classList.add("hidden");

      hud?.setVisible(game.running && modal !== "class_select");

      if (modal === "class_select") {
        const switching = Boolean((payload as { switching?: boolean } | undefined)?.switching);
        classSelect.show(switching);
      } else if (modal === "dialogue") {
        const npcId = (payload as { npcId?: string } | undefined)?.npcId ?? "npc_elder";
        dialogue.show(npcId);
      } else if (modal === "inventory") {
        inventory.show();
      } else if (modal === "forge") {
        forge.show();
      } else if (modal === "world_map") {
        worldMap.show();
      } else if (modal === "journal") {
        journal.show(payload as { tab?: "quests" | "lore"; loreId?: string } | undefined);
      } else if (modal === "pause") {
        pauseModal.classList.remove("hidden");
      }
    },
    onBossVictory: (worldBoss: boolean, bossName: string) => {
      if (worldBoss) {
        document.getElementById("victory-title")!.textContent =
          "BẢN GIAO HƯỞNG THẤT SẮC — THE ERASER ĐÃ ĐƯỢC THANH TẨY!";
        document.getElementById("victory-desc")!.textContent =
          `Giao thức xóa sổ của Kiến Trúc Sư Vaelor đã khép lại trong bình yên, trả lại bầu trời 16-bit rực rỡ cho Aethel-16! Bạn có thể tiếp tục khám phá toàn bộ Bia Ký, mở đủ 9 Trụ Sắc Màu và thức tỉnh thần khí +10.`;
        document.getElementById("victory-stats")!.textContent =
          `LV.${game.player.level} · Hạ gục: ${game.stats.kills} · Phản ứng: ${game.stats.reactionsTriggered ?? 0} · Bia Ký: ${game.discoveredLore.size}/8 · Màu khôi phục: ${game.colorSys.getProgressPct()}%`;
        victoryModal.classList.remove("hidden");
      } else {
        hud.toast(`ĐÃ GIẢI THOÁT THỦ LĨNH ${bossName}! Kiểm tra chiến lợi phẩm & về gặp Trưởng Làng Elian!`, "epic");
      }
    },
  });

  classSelect = new ClassSelectUI(game);
  hud = new HudUI(game);
  dialogue = new DialogueModalUI(game);
  inventory = new InventoryModalUI(game);
  forge = new ForgeModalUI(game);
  worldMap = new WorldMapModalUI(game);
  journal = new QuestJournalModalUI(game);
  itemTooltip = new ItemReviewTooltip(game);

  // Pause Modal Controls
  document.getElementById("btn-pause-resume")!.addEventListener("click", () => {
    sfx.playUiClick();
    game.setModal(null);
  });
  document.getElementById("btn-pause-save")!.addEventListener("click", () => {
    game.saveGame(true);
  });
  document.getElementById("btn-pause-title")!.addEventListener("click", () => {
    sfx.playUiClick();
    game.saveGame(false);
    game.running = false;
    game.setModal("class_select", { switching: false });
  });
  document.getElementById("btn-pause-reset")!.addEventListener("click", () => {
    sfx.playUiClick();
    game.saveSys.clear();
    game.running = false;
    game.setModal("class_select", { switching: false });
    hud.toast("Đã xóa file Save cũ. Hãy chọn Class để bắt đầu hành trình mới!", "warn");
  });

  // Victory Modal Continue Exploring Button
  document.getElementById("btn-victory-continue")!.addEventListener("click", () => {
    sfx.playUiClick();
    victoryModal.classList.add("hidden");
  });

  // Expose light debug handle for Playwright/DevTools inspection if needed
  (window as unknown as { __pixtel?: PixTelOpenWorldGame }).__pixtel = game;

  classSelect.show(false);
  game.startLoop();
}

window.addEventListener("DOMContentLoaded", bootstrap);
