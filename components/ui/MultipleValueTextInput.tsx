"use client";

import { useState, useEffect, ReactNode } from "react";

interface MultipleValueTextInputProps {
	/** Any values the input's collection should be prepopulated with. */
	values?: string[];
	/** Method which should be called when an item is added to the collection */
	onItemAdded?: (newItem: string, resultItems: string[]) => void;
	/** Method which should be called when an item is removed from the collection */
	onItemDeleted?: (deletedItem: string, resultItems: string[]) => void;
	/** Label to be attached to the input, if desired */
	label?: string;
	/** Name attribute for the input */
	name: string;
	/** Placeholder attribute for the input, if desired */
	placeholder?: string;
	/** Keys which should trigger an item to be added (defaults to comma and Enter) */
	submitKeys?: string[];
	/** JSX or string which will be used as the control to delete an item */
	deleteButton?: ReactNode;
	/** Whether or not the blur event should trigger the added-item handler */
	shouldAddOnBlur?: boolean;
	/** Custom class name for the input element */
	className?: string;
	/** Custom class name for the input label element */
	labelClassName?: string;
	/** Custom class name for the item chips/tags */
	itemClassName?: string;
}

interface MultipleValueTextInputItemProps {
	value: string;
	handleItemRemove: (removedValue: string) => void;
	deleteButton: ReactNode;
	itemClassName?: string;
}

const MultipleValueTextInputItem = ({
	value,
	handleItemRemove,
	deleteButton,
	itemClassName = "",
}: MultipleValueTextInputItemProps) => {
	return (
		<span className={itemClassName} role="listitem">
			<span>{value}</span>{" "}
			<span
				className="cursor-pointer"
				tabIndex={-1}
				role="button"
				onKeyUp={() => handleItemRemove(value)}
				onClick={() => handleItemRemove(value)}
			>
				{deleteButton}
			</span>
		</span>
	);
};

export const MultipleValueTextInput = ({
	placeholder = "",
	label = "",
	name,
	deleteButton = <span>&times;</span>,
	onItemAdded = () => null,
	onItemDeleted = () => null,
	className = "",
	labelClassName = "",
	itemClassName = "",
	submitKeys = ["Enter", ","],
	values: initialValues = [],
	shouldAddOnBlur,
}: MultipleValueTextInputProps) => {
	const [values, setValues] = useState(initialValues);
	const [value, setValue] = useState("");

	const initialKey = JSON.stringify(initialValues);
	useEffect(() => {
		setValues(initialValues);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialKey]);
	const nonCharacterKeyLabels: string[] = ["Enter", "Tab"];
	const delimiters: string[] = submitKeys.filter(
		(element) => !nonCharacterKeyLabels.includes(element)
	);

	const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.currentTarget.value);
	};

	const handleItemAdd = (addedValue: string) => {
		if (values.includes(addedValue) || !addedValue) {
			setValue("");
			return;
		}
		const newValues = values.concat(addedValue);
		setValues(newValues);
		setValue("");
		onItemAdded(addedValue, newValues);
	};

	const handleItemsAdd = (addedValues: string[]) => {
		const uniqueValues = Array.from(
			new Set(addedValues.filter((elm) => elm && !values.includes(elm)))
		);
		if (uniqueValues.length > 0) {
			const newValues = Array.from(new Set([...values, ...uniqueValues]));
			setValues(newValues);
			setValue("");
			uniqueValues.forEach((addedValue) => {
				onItemAdded(addedValue, newValues);
			});
		} else {
			setValue("");
		}
	};

	const handleItemRemove = (removedValue: string) => {
		const currentValues = values;
		const newValues = currentValues.filter((v) => v !== removedValue);
		onItemDeleted(removedValue, newValues);
		setValues(newValues);
	};

	const handleKeypress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (submitKeys.includes(e.key)) {
			e.preventDefault();
			handleItemAdd(e.currentTarget.value);
		}
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		if (shouldAddOnBlur) {
			e.preventDefault();
			handleItemAdd(e.target.value);
		}
	};

	const splitMulti = (str: string) => {
		const tempChar = delimiters[0];
		let result: string = str;
		for (let i = 1; i < delimiters.length; i += 1) {
			result = result.split(delimiters[i]).join(tempChar);
		}
		return result.split(tempChar);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pastedText = e.clipboardData.getData("text/plain");
		const areSubmitKeysPresent = delimiters.some((d) => pastedText.includes(d));
		if (areSubmitKeysPresent) {
			const splitTerms = splitMulti(pastedText);
			if (splitTerms.length > 0) {
				e.preventDefault();
				handleItemsAdd(splitTerms);
			}
		}
	};

	const valueDisplays = values.map((v) => (
		<MultipleValueTextInputItem
			value={v}
			key={v}
			deleteButton={deleteButton}
			handleItemRemove={handleItemRemove}
			itemClassName={itemClassName}
		/>
	));

	return (
		<div className="multiple-value-text-input" role="form">
			<label htmlFor={name} className={labelClassName}>
				{label}
				<div className="multiple-value-text-input-item-container">
					{values.length > 0 && <p role="list">{valueDisplays}</p>}
				</div>
				<input
					aria-label={label}
					name={name}
					placeholder={placeholder}
					value={value}
					type="text"
					onKeyPress={handleKeypress}
					onChange={handleValueChange}
					onPaste={handlePaste}
					onBlur={handleBlur}
					className={className}
				/>
			</label>
		</div>
	);
};
