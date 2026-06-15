'use client';

import { Button, Modal } from '@heroui/react';

interface OverlayStateLike {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export interface ConfirmDeleteModalProps {
  state: OverlayStateLike;
  entityLabel: string;
  entityName: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  state,
  entityLabel,
  entityName,
  isDeleting,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="bg-canvas inset-ring-error inset-ring-2">
            <Modal.Header>
              <Modal.Heading>删除{entityLabel}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                确认要删除{entityLabel} &quot;{entityName}&quot; 吗？此操作不可撤销。
              </p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" onPress={state.close}>
                取消
              </Button>
              <Button
                variant="danger"
                isDisabled={isDeleting}
                onPress={onConfirm}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
