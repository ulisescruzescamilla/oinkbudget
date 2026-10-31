import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CategoryForm } from './CategoryForm';
import type { CategoryType } from '@/types/CategoryType';

// `ModalField`'s `Input` renders `BottomSheetTextInput`, which needs a real bottom-sheet
// context to mount, so it's swapped for a plain `TextInput` here.
jest.mock('@gorhom/bottom-sheet', () => {
  const { TextInput } = require('react-native');
  return { BottomSheetTextInput: TextInput };
});

const categories: CategoryType[] = [
  { id: 1, name: 'Mercado', icon_code: 'cart', color: '#8C6DE2', type: 'expense' },
  { id: 8, name: 'Otro', icon_code: 'star', color: '#7575E9', type: 'expense' },
];

describe('CategoryForm', () => {
  it('submits the entered name with the picked color and icon', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 9 });
    const onDone = jest.fn();
    await render(
      <CategoryForm categories={categories} onSubmit={onSubmit} onDone={onDone} fieldErrors={null} />
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mascotas'), '  Mascotas ');
    await fireEvent.press(screen.getByLabelText('color #1289E7'));
    await fireEvent.press(screen.getByLabelText('paw'));
    await fireEvent.press(screen.getByText('Crear categoría'));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Mascotas', color: '#1289E7', icon_code: 'paw' });
  });

  it('rejects a duplicate name, ignoring case', async () => {
    const onSubmit = jest.fn();
    await render(
      <CategoryForm categories={categories} onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mascotas'), 'mercado');
    await fireEvent.press(screen.getByText('Crear categoría'));

    expect(screen.getByText('Ya existe una categoría con ese nombre')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('pre-fills an edited category and allows keeping its own name', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ id: 1 });
    await render(
      <CategoryForm
        category={categories[0]}
        categories={categories}
        onSubmit={onSubmit}
        onDone={jest.fn()}
        fieldErrors={null}
      />
    );

    expect(screen.getByDisplayValue('Mercado')).toBeTruthy();
    await fireEvent.press(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Mercado', color: '#8C6DE2', icon_code: 'cart' })
    );
  });

  it('locks the name of the default category', async () => {
    await render(
      <CategoryForm category={categories[1]} categories={categories} onSubmit={jest.fn()} onDone={jest.fn()} fieldErrors={null} />
    );

    expect(screen.getByDisplayValue('Otro').props.editable).toBe(false);
    expect(screen.getByText('Predeterminada')).toBeTruthy();
  });

  it('renders 422 field errors and stays open on failure', async () => {
    const onDone = jest.fn();
    await render(
      <CategoryForm
        categories={categories}
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        onDone={onDone}
        fieldErrors={{ icon_code: ['El ícono no es válido.'] }}
      />
    );

    expect(screen.getByText('El ícono no es válido.')).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mascotas'), 'Viajes');
    await fireEvent.press(screen.getByText('Crear categoría'));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('shows the API name error after a failed submit and hides it once the name changes', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { rerender } = await render(
      <CategoryForm categories={categories} onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mascotas'), 'Viajes');
    await fireEvent.press(screen.getByText('Crear categoría'));
    // The hook surfaces the 422 body's `errors` as `fieldErrors`.
    await rerender(
      <CategoryForm
        categories={categories}
        onSubmit={onSubmit}
        onDone={jest.fn()}
        fieldErrors={{ name: ['Ya existe una categoría con ese nombre.'] }}
        errorMessage="The given data was invalid."
      />
    );

    expect(screen.getByText('Ya existe una categoría con ese nombre.')).toBeTruthy();
    expect(screen.queryByText('The given data was invalid.')).toBeNull();

    await fireEvent.changeText(screen.getByPlaceholderText('Ej. Mascotas'), 'Viajes 2026');
    expect(screen.queryByText('Ya existe una categoría con ese nombre.')).toBeNull();
  });

  describe('with a kind (expense / income categories)', () => {
    it('submits the picked type with the category', async () => {
      const onSubmit = jest.fn().mockResolvedValue({ id: 9 });
      const onDone = jest.fn();
      await render(
        <CategoryForm categories={categories} kind="expense" onSubmit={onSubmit} onDone={onDone} fieldErrors={null} />
      );

      await fireEvent.press(screen.getByText('Ingreso'));
      await fireEvent.changeText(screen.getByPlaceholderText('Ej. Freelance'), 'Freelance');
      await fireEvent.press(screen.getByText('Crear categoría'));

      await waitFor(() => expect(onDone).toHaveBeenCalled());
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Freelance', type: 'income' })
      );
    });

    it('only rejects duplicate names within the same type', async () => {
      const onSubmit = jest.fn().mockResolvedValue({ id: 9 });
      await render(
        <CategoryForm categories={categories} kind="income" onSubmit={onSubmit} onDone={jest.fn()} fieldErrors={null} />
      );

      await fireEvent.changeText(screen.getByPlaceholderText('Ej. Freelance'), 'Mercado');
      await fireEvent.press(screen.getByText('Crear categoría'));

      expect(screen.queryByText('Ya existe una categoría con ese nombre')).toBeNull();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'income' })));
    });

    it('hides the type picker when editing', async () => {
      await render(
        <CategoryForm
          category={categories[0]}
          categories={categories}
          kind="expense"
          onSubmit={jest.fn()}
          onDone={jest.fn()}
          fieldErrors={null}
        />
      );

      expect(screen.queryByText('Tipo')).toBeNull();
      expect(screen.getByText('Gasto')).toBeTruthy();
    });
  });
});
