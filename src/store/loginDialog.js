import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoginDialogStore = defineStore("loginDialog", () => {
  const visible = ref(false);

  const show = () => {
    visible.value = true;
  };

  const hide = () => {
    visible.value = false;
  };

  return {
    visible,
    show,
    hide,
  };
});

