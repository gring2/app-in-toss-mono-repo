export type ConfirmDialogOptions = {
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm: () => void;
};

type ConfirmDialogElements = {
  root: HTMLElement;
  title: HTMLElement;
  description: HTMLElement;
  cancelButton: HTMLButtonElement;
  confirmButton: HTMLButtonElement;
};

export function createConfirmDialogController({ elements }: { elements: ConfirmDialogElements }) {
  let currentOptions: ConfirmDialogOptions | null = null;

  const syncBodyState = (open: boolean) => {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.toggle('has-modal', open);
  };

  const hideDialog = () => {
    elements.root.classList.add('is-hidden');
    elements.root.setAttribute('aria-hidden', 'true');
    syncBodyState(false);
    currentOptions = null;
  };

  const handleCancel = () => {
    const options = currentOptions;
    hideDialog();
    options?.onCancel?.();
  };

  const handleConfirm = () => {
    const options = currentOptions;
    hideDialog();
    options?.onConfirm();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !currentOptions) {
      return;
    }

    event.preventDefault();
    handleCancel();
  };

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', handleKeydown);
  }

  elements.cancelButton.addEventListener('click', () => {
    handleCancel();
  });

  elements.confirmButton.addEventListener('click', () => {
    handleConfirm();
  });

  elements.root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !currentOptions) {
      return;
    }

    if (target.dataset.dialogDismiss === 'true') {
      handleCancel();
    }
  });

  return {
    open(options: ConfirmDialogOptions) {
      currentOptions = options;
      elements.title.textContent = options.title;
      elements.description.textContent = options.description ?? '';
      elements.description.classList.toggle('is-hidden', !options.description);
      elements.cancelButton.textContent = options.cancelText ?? '취소';
      elements.confirmButton.textContent = options.confirmText ?? '확인';
      elements.root.classList.remove('is-hidden');
      elements.root.setAttribute('aria-hidden', 'false');
      syncBodyState(true);
      elements.cancelButton.focus();
    },
    close() {
      hideDialog();
    },
    isOpen() {
      return currentOptions !== null;
    },
  };
}
