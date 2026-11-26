import "@fontsource-variable/pixelify-sans";
import { PixTelOpenWorldGame, type ModalId } from "./game";
import { HomeScreenUI } from "./ui/HomeScreen";
import { ClassSelectUI } from "./ui/ClassSelect";
import { CutsceneModalUI, type CutscenePlayPayload } from "./ui/CutsceneModal";
import { HudUI } from "./ui/HUD";
import { DialogueModalUI } from "./ui/DialogueModal";
import { InventoryModalUI } from "./ui/InventoryModal";
import { StorageChestModalUI } from "./ui/StorageChestModal";
import { ForgeModalUI } from "./ui/ForgeModal";
import { GachaModalUI } from "./ui/GachaModal";
import { WorldMapModalUI } from "./ui/WorldMapModal";
import { QuestJournalModalUI } from "./ui/QuestJournalModal";
import { TutorialModalUI, type TutorialTabId } from "./ui/TutorialModal";
import { CoopModalUI } from "./ui/CoopModal";
import { MobileTouchUI } from "./ui/MobileTouchUI";
import { ItemReviewTooltip } from "./ui/ItemReviewTooltip";
import { normalizeRoomCode } from "./net/protocol";
import { installRopeFrameAssets } from "./graphics/ropeFrame";
import { sfx } from "./audio/chiptuneSynth";

function bootstrap() {
  installRopeFrameAssets();
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  const pauseModal = document.getElementById("modal-pause")!;
  const victoryModal = document.getElementById("modal-victory")!;

  let homeScreen: HomeScreenUI;
  let classSelect: ClassSelectUI;
  let cutsceneModal: CutsceneModalUI;
  let hud: HudUI;
  let dialogue: DialogueModalUI;
  let inventory: InventoryModalUI;
  let stashModal: StorageChestModalUI;
  let forge: ForgeModalUI;
  let gachaModal: GachaModalUI;
  let worldMap: WorldMapModalUI;
  let journal: QuestJournalModalUI;
  let tutorial: TutorialModalUI;
  let coopModal: CoopModalUI;
  let mobileTouch: MobileTouchUI;
  let itemTooltip: ItemReviewTooltip;

  const game = new PixTelOpenWorldGame(canvas, {
    onHudUpdate: () => {
      hud?.update();
      mobileTouch?.update();
      if (game.activeModal === "coop" && game.coop.isConnected) {
        coopModal?.render();
      }
    },
    onToast: (msg, tone) => hud?.toast(msg, tone),
    onModalChange: (modal: ModalId, payload?: unknown) => {
      itemTooltip?.hide();
      homeScreen?.hide();
      classSelect?.hide();
      cutsceneModal?.hide();
      dialogue?.hide();
      inventory?.hide();
      stashModal?.hide();
      forge?.hide();
      gachaModal?.hide();
      worldMap?.hide();
      journal?.hide();
      tutorial?.hide();
      coopModal?.hide();
      pauseModal.classList.add("hidden");

      const hideHud = modal === "home" || modal === "class_select" || modal === "cutscene";
      hud?.setVisible(game.running && !hideHud);
      mobileTouch?.update();

      if (modal === "home") {
        homeScreen.show();
      } else if (modal === "class_select") {
        const switching = Boolean((payload as { switching?: boolean } | undefined)?.switching);
        classSelect.show(switching);
      } else if (modal === "cutscene") {
        cutsceneModal.show(payload as CutscenePlayPayload | undefined);
      } else if (modal === "dialogue") {
        const npcId = (payload as { npcId?: string } | undefined)?.npcId ?? "npc_elder";
        dialogue.show(npcId);
      } else if (modal === "inventory") {
        inventory.show(payload as { quickSell?: boolean } | undefined);
      } else if (modal === "stash") {
        stashModal.show();
      } else if (modal === "forge") {
        forge.show();
      } else if (modal === "gacha") {
        gachaModal.show();
      } else if (modal === "world_map") {
        worldMap.show();
      } else if (modal === "journal") {
        journal.show(payload as { tab?: "quests" | "lore" | "cutscenes"; loreId?: string } | undefined);
      } else if (modal === "tutorial") {
        const initTab = (payload as { tab?: TutorialTabId } | undefined)?.tab;
        tutorial.show(initTab);
      } else if (modal === "coop") {
        const code = (payload as { code?: string } | undefined)?.code;
        coopModal.show(code);
      } else if (modal === "pause") {
        pauseModal.classList.remove("hidden");
      }
    },
    onBossVictory: (worldBoss: boolean, bossName: string) => {
      if (worldBoss) {
        const heroName = game.player.name || game.pendingPlayerName || "Chroma-Walker";
        document.getElementById("victory-title")!.textContent =
          `BẢN GIAO HƯỞNG THẤT SẮC — ${heroName.toUpperCase()} ĐÃ THANH TẨY THE ERASER!`;
        document.getElementById("victory-desc")!.textContent =
          `Giao thức xóa sổ của Kiến Trúc Sư Vaelor đã khép lại trong bình yên, trả lại bầu trời 16-bit rực rỡ cho Aethel-16! Bạn có thể tiếp tục khám phá toàn bộ Bia Ký, xem lại Phim Cốt Truyện [J], mở đủ 9 Trụ Sắc Màu và thức tỉnh thần khí +10.`;
        document.getElementById("victory-stats")!.textContent =
          `${heroName} · LV.${game.player.level} · Hạ gục: ${game.stats.kills} · Phản ứng: ${game.stats.reactionsTriggered ?? 0} · Bia Ký: ${game.discoveredLore.size}/8 · Màu khôi phục: ${game.colorSys.getProgressPct()}%`;
        victoryModal.classList.remove("hidden");
      } else {
        hud.toast(`ĐÃ GIẢI THOÁT THỦ LĨNH ${bossName}! Kiểm tra chiến lợi phẩm & về gặp Trưởng Làng Elian!`, "epic");
      }
    },
  });

  homeScreen = new HomeScreenUI(game);
  classSelect = new ClassSelectUI(game);
  cutsceneModal = new CutsceneModalUI(game);
  hud = new HudUI(game);
  dialogue = new DialogueModalUI(game);
  inventory = new InventoryModalUI(game);
  stashModal = new StorageChestModalUI(game);
  forge = new ForgeModalUI(game);
  gachaModal = new GachaModalUI(game);
  worldMap = new WorldMapModalUI(game);
  journal = new QuestJournalModalUI(game);
  tutorial = new TutorialModalUI(game);
  coopModal = new CoopModalUI(game);
  mobileTouch = new MobileTouchUI(game);
  itemTooltip = new ItemReviewTooltip(game);

  hud.onToggleTouch = () => {
    mobileTouch.toggleMobileOverlay();
    hud.toast(
      game.mobileMode
        ? "📱 Đã bật giao diện cảm ứng Mobile (Twin-Stick + Tự Ngắm Thông Minh)!"
        : "🖥 Đã tắt giao diện cảm ứng Mobile.",
      "info"
    );
  };

  // URL Invite Link (?room=CODE & optional ?ws=ws://...)
  const params = new URLSearchParams(window.location.search);
  const wsParam = params.get("ws");
  if (wsParam) {
    game.coop.mode = "ws";
    game.coop.wsServerUrl = wsParam;
  }
  const roomParam = params.get("room");
  if (roomParam) {
    const cleanCode = normalizeRoomCode(roomParam);
    if (cleanCode) {
      coopModal.setDraftCode(cleanCode);
      homeScreen.setPendingRoomInvite(cleanCode);
      classSelect.setPendingRoomInvite(cleanCode);
    }
  }

  // Pause Modal Controls
  document.getElementById("btn-pause-resume")!.addEventListener("click", () => {
    sfx.playUiClick();
    game.setModal(null);
  });
  document.getElementById("btn-pause-coop")?.addEventListener("click", () => {
    game.toggleModal("coop");
  });
  document.getElementById("btn-pause-help")?.addEventListener("click", () => {
    game.toggleModal("tutorial");
  });
  document.getElementById("btn-pause-save")!.addEventListener("click", () => {
    game.saveGame(true);
  });
  document.getElementById("btn-pause-title")!.addEventListener("click", () => {
    sfx.playUiClick();
    game.saveGame(false);
    game.running = false;
    game.setModal("home");
  });
  document.getElementById("btn-pause-reset")!.addEventListener("click", () => {
    sfx.playUiClick();
    game.saveSys.clear();
    game.running = false;
    game.setModal("home");
    hud.toast("Đã xóa file Save cũ. Hãy đặt tên & chọn Class để bắt đầu hành trình mới!", "warn");
  });

  // Victory Modal Continue Exploring Button
  document.getElementById("btn-victory-continue")!.addEventListener("click", () => {
    sfx.playUiClick();
    victoryModal.classList.add("hidden");
  });

  // Register PWA Service Worker for Mobile Home Screen / Offline Asset Caching
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  // Expose light debug handle for Playwright/DevTools inspection if needed
  (window as unknown as { __pixtel?: PixTelOpenWorldGame }).__pixtel = game;

  // Boot into the dedicated Home Screen (Player Name -> Class Select -> Start + Intro Cutscene)
  game.setModal("home");
  mobileTouch.update();
  game.startLoop();
}

window.addEventListener("DOMContentLoaded", bootstrap);
