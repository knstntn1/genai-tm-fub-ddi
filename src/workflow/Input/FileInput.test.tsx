import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileInput from './FileInput';
import TestWrapper from '../../util/TestWrapper';

vi.mock('@genaitm/util/TeachableModel', () => ({
    useTeachableModel: () => ({
        imageSize: 224,
        canPredict: true,
    }),
}));

describe('FileInput component', () => {
    it('shows selected image inputs 25 percent smaller without resizing the source canvas', ({ expect }) => {
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;

        render(
            <FileInput
                isAudio={false}
                example={canvas}
                enableInput={true}
                onExample={vi.fn()}
            />,
            { wrapper: TestWrapper }
        );

        const selectedImage = screen.getByRole('img', { name: 'input.aria.imageFile' });
        const displayedCanvas = selectedImage.querySelector('canvas');

        expect(displayedCanvas).toBe(canvas);
        expect(canvas.width).toBe(224);
        expect(canvas.height).toBe(224);
        expect(canvas.style.width).toBe('168px');
        expect(canvas.style.height).toBe('168px');
    });
});
