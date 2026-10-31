/**
 * CategoryForm — create/edit a category: live preview, name, type (expense or
 * income, only when creating), color swatch and icon grid. Ported from
 * `TxCategoryForm` in `design/src/txcats.jsx`; without `kind` it is the
 * untyped `CategoryForm` of `design/src/categories.jsx`, used for recurrent
 * budgets. Wires to the hook mutations via props and renders per-field 422
 * errors.
 */
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Chip, Icon, IconTile, ModalField, Text } from '@/components/ui';
import { CategoryKind } from '@/types/CategoryType';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import { CATEGORY_COLORS, CATEGORY_ICONS, categorySoft, isDefaultCategory } from '@/styles/categories';
import { useIsDark, useTheme } from '@/styles/useTheme';
import type { IconName } from '@/components/ui';

/** The fields the form edits; shared by categories and recurrent budgets. */
export interface CategoryFormItem {
  id: number;
  name: string;
  icon_code: string;
  color: string;
  /** Only categories have a type. */
  type?: CategoryKind;
}

/** What the form submits; `type` is set only when the form has a `kind`. */
export type CategoryFormPayload = Omit<CategoryFormItem, 'id'>;

export interface CategoryFormProps {
  /** Category being edited; omit to create a new one. */
  category?: CategoryFormItem | null;
  /** Every existing category, used to reject duplicate names. */
  categories: CategoryFormItem[];
  /**
   * Type preselected for a new category. When set, the form shows the type
   * picker (on create), labels the preview with the type and submits `type`;
   * duplicates are then only checked within the same type.
   */
  kind?: CategoryKind;
  /** Submit handler returning the saved category (undefined on error). */
  onSubmit: (payload: CategoryFormPayload) => Promise<CategoryFormItem | undefined>;
  /** Called after a successful save. */
  onDone: () => void;
  /** Per-field errors from the last failed submit (422 response). */
  fieldErrors: FieldErrors | null;
  /** General error message from the last failed submit (offline, server error…). */
  errorMessage?: string | null;
  loading?: boolean;
  /** UI strings; defaults to the category wording. */
  copy?: CategoryFormCopy;
}

/** Strings that name the edited entity, so the form can serve categories and recurrent budgets. */
export interface CategoryFormCopy {
  /** Preview title while the name is empty. */
  placeholder: string;
  /** Inline error for a name already in the list. */
  duplicate: string;
  /** Submit button label when creating. */
  create: string;
}

const CATEGORY_COPY: CategoryFormCopy = {
  placeholder: 'Nueva categoría',
  duplicate: 'Ya existe una categoría con ese nombre',
  create: 'Crear categoría',
};

/** Fields whose 422 errors the form renders inline; any other failure falls back to `errorMessage`. */
const DISPLAYED_FIELDS = ['name', 'color', 'icon_code'];

/** Type picker options. */
const KINDS: { value: CategoryKind; label: string; icon: IconName }[] = [
  { value: 'expense', label: 'Gasto', icon: 'down' },
  { value: 'income', label: 'Ingreso', icon: 'up' },
];

/** Form for creating or editing a category. */
export function CategoryForm({
  category,
  categories,
  kind,
  onSubmit,
  onDone,
  fieldErrors,
  errorMessage,
  loading,
  copy = CATEGORY_COPY,
}: CategoryFormProps) {
  const t = useTheme();
  const dark = useIsDark();
  const locked = !!category && isDefaultCategory(category.name);
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<IconName>((category?.icon_code as IconName) ?? 'tag');
  const typed = kind !== undefined;
  const [type, setType] = useState<CategoryKind>(category?.type ?? kind ?? 'expense');
  // The type is fixed once created, so the picker only shows for a new category.
  const showTypePicker = typed && !category;
  const [failed, setFailed] = useState(false);
  // Name sent with the last submit; a server name error only applies while the input still matches it.
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  useEffect(() => {
    setName(category?.name ?? '');
    setColor(category?.color ?? CATEGORY_COLORS[0]);
    setIcon((category?.icon_code as IconName) ?? 'tag');
    setType(category?.type ?? kind ?? 'expense');
    setFailed(false);
    setSubmittedName(null);
  }, [category, kind]);

  const errors = fieldErrors ?? undefined;
  const trimmed = name.trim();
  const dup = categories.some(
    (c) =>
      (!typed || c.type === type) && c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== category?.id
  );
  const valid = trimmed.length > 0 && !dup;
  const displayedFields = showTypePicker ? [...DISPLAYED_FIELDS, 'type'] : DISPLAYED_FIELDS;
  const hasInlineError = displayedFields.some((field) => getFieldError(errors, field));
  // e.g. the API's 422 "Ya existe una categoría con ese nombre." for a name taken on the server.
  const serverNameError = trimmed === submittedName ? getFieldError(errors, 'name') : undefined;
  const soft = categorySoft(color, dark);

  const submit = async () => {
    if (!valid) return;
    setFailed(false);
    setSubmittedName(trimmed);
    const result = await onSubmit({ name: trimmed, color, icon_code: icon, ...(typed ? { type } : null) });
    if (result) onDone();
    else setFailed(true);
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3.5 rounded-inner bg-card-2 p-3.5">
        <IconTile icon={icon} size={52} bg={soft} color={color} />
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[17px] tracking-tight" numberOfLines={1}>
            {trimmed || copy.placeholder}
          </Text>
          {typed ? (
            <Text className="mt-0.5 text-[12.5px] font-strong text-muted">{type === 'income' ? 'Ingreso' : 'Gasto'}</Text>
          ) : locked ? (
            <Text className="mt-0.5 text-[12.5px] font-strong text-muted">Predeterminada</Text>
          ) : null}
        </View>
      </View>

      <ModalField
        label="Nombre"
        placeholder={typed && type === 'income' ? 'Ej. Freelance' : 'Ej. Mascotas'}
        value={name}
        onChangeText={setName}
        editable={!locked}
        autoFocus={!category}
        onSubmitEditing={submit}
        error={dup ? copy.duplicate : serverNameError}
      />

      {showTypePicker ? (
        <View className="gap-[7px]">
          <Text className="text-[12.5px] font-strong text-muted">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {KINDS.map((k) => (
              <Chip key={k.value} label={k.label} icon={k.icon} active={type === k.value} onPress={() => setType(k.value)} />
            ))}
          </View>
          {getFieldError(errors, 'type') ? (
            <Text className="text-[12px] font-semi text-danger">{getFieldError(errors, 'type')}</Text>
          ) : null}
        </View>
      ) : null}

      <View className="gap-[7px]">
        <Text className="text-[12.5px] font-strong text-muted">Color</Text>
        <View className="flex-row flex-wrap gap-2.5 p-0.5">
          {CATEGORY_COLORS.map((c) => {
            const on = color.toUpperCase() === c;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`color ${c}`}
                accessibilityState={{ selected: on }}
                className="active:scale-[0.92]"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: c,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // The design's double ring: a card-colored gap, then the swatch color.
                  borderWidth: on ? 2 : 0,
                  borderColor: t.card,
                  outlineWidth: on ? 2 : 0,
                  outlineColor: c,
                  outlineStyle: 'solid',
                }}
              >
                {on ? <Icon name="check" size={15} strokeWidth={3} color="#FFFFFF" /> : null}
              </Pressable>
            );
          })}
        </View>
        {getFieldError(errors, 'color') ? (
          <Text className="text-[12px] font-semi text-danger">{getFieldError(errors, 'color')}</Text>
        ) : null}
      </View>

      <View className="gap-[7px]">
        <Text className="text-[12.5px] font-strong text-muted">Ícono</Text>
        <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
          {CATEGORY_ICONS.map((ic) => {
            const on = icon === ic;
            return (
              <View key={ic} style={{ width: `${100 / 6}%`, padding: 4 }}>
                <Pressable
                  onPress={() => setIcon(ic)}
                  accessibilityRole="button"
                  accessibilityLabel={ic}
                  accessibilityState={{ selected: on }}
                  className={on ? 'border-transparent' : 'border-border-2 bg-card'}
                  style={{
                    aspectRatio: 1,
                    minHeight: 44,
                    borderRadius: 13,
                    borderWidth: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(on ? { backgroundColor: soft } : null),
                  }}
                >
                  <Icon name={ic} size={20} strokeWidth={2} color={on ? color : t.muted} />
                </Pressable>
              </View>
            );
          })}
        </View>
        {getFieldError(errors, 'icon_code') ? (
          <Text className="text-[12px] font-semi text-danger">{getFieldError(errors, 'icon_code')}</Text>
        ) : null}
      </View>

      {failed && !hasInlineError && errorMessage ? (
        <Text className="text-[12px] font-semi text-danger">{errorMessage}</Text>
      ) : null}

      <Button icon="check" block size="lg" loading={loading} disabled={!valid} onPress={submit}>
        {category ? 'Guardar cambios' : copy.create}
      </Button>
    </View>
  );
}

export default CategoryForm;
