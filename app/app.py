"""secrets management"""
import os
import logging
from shiny import reactive, render, ui
import shiny
from make_patent_component import (
    langfuse,
    generate_primary_invention,
    generate_field_of_invention,
    generate_background,
    generate_summary,
    generate_technology_platform,
    generate_description_of_invention,
    generate_product,
    generate_uses,
)


ENVIRONMENT = os.getenv("ENV")

logging.basicConfig(level=logging.INFO)

# Define UI
app_ui = ui.page_fluid(
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_text_area(
                "antigen",
                "Enter Antigen",
                resize="vertical",
            ),
            ui.input_text_area(
                "disease",
                "Enter Disease",
                resize="vertical",
            ),
            ui.input_action_button("generate", "Generate", class_="btn btn-primary"),
        ),

        ui.card(
            ui.output_ui("background_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),

        ui.card(
            ui.output_ui("field_of_invention_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),

        ui.card(
            ui.output_ui("summary_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),

        ui.card(
            ui.output_ui("primary_invention_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),

        ui.card(
            ui.output_ui("technology_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),

        ui.card(
            ui.output_ui("description_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),

        ui.card(
            ui.output_ui("product_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0",  # Placeholder for dynamically generated cards
        ),
        height="100vh",
    )
)


def generate_card_content(response_text, generation_step):
    """
    generate the content of the output cards based on the generation step
    """
    response_text = str(response_text)
    step_id = generation_step.lower().replace(" ", "_")

    print(generation_step)
    if generation_step == "product":
        return ui.div(
            ui.div(
                ui.input_text_area(
                    f"{step_id}",
                    generation_step,
                    value=response_text,
                    width="100%",
                    height="100%",
                    rows=8,
                    resize="none",
                ),
                class_="card-body h-100",
            ),
            ui.div(
                ui.input_action_button(
                    f"thumbs_up_{step_id}",
                    "👍",
                    class_="btn btn-success p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.popover(
                    ui.input_action_button(
                        f"thumbs_down_{step_id}",
                        "👎",
                        class_="btn btn-danger p-0",
                        width="3vw",
                        disabled=True,
                    ),
                    ui.input_text_area(
                        f"reasoning_thumbs_down_{step_id}",
                        "thumbs down feedback",
                        height="30vh",
                        width="30vw",
                        resize="none",
                        spellcheck=True,
                        placeholder="Please provide your feedback about what you didn't like or what could be improved.",
                    ),
                    ui.input_action_button(
                        f"save_reasoning_thumbs_down_{step_id}",
                        "📝",
                        class_="btn btn-secondary p-0",
                        width="3vw",
                    ),
                    id=f"thumbs_down_popover_{step_id}",
                ),
                ui.popover(
                    ui.input_action_button(
                        f"save_{step_id}",
                        "💾",
                        class_="btn btn-secondary p-0",
                        width="3vw",
                        disabled=True,
                    ),
                    ui.input_text_area(
                        f"reasoning_{step_id}",
                        generation_step,
                        height="30vh",
                        width="30vw",
                        resize="none",
                        spellcheck=True,
                        placeholder="Please provide reasoning for your edits and/or feedback if applicable. this will help us improve the quality of our LLM"
                    ),
                    ui.input_action_button(
                        f"save_reasoning_{step_id}",
                        "📝",
                        class_="btn btn-secondary p-0",
                        width="3vw",
                    ),
                    id=f"{step_id}_popover",
                ),
                ui.input_action_button(
                    f"{step_id}_retry",
                    "🔄",
                    class_="btn btn-primary p-0",
                    width="3vw",
                    disabled=True,
                ),
                class_="card-footer mt-2",
            ),
            class_="card h-100 p-0",
        )

    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}",
                generation_step,
                value=response_text,
                width="100%",
                height="100%",
                rows=8,
                resize="none",
            ),
            class_="card-body h-100",
        ),
        ui.div(
            ui.input_action_button(
                f"thumbs_up_{step_id}",
                "👍",
                class_="btn btn-success p-0",
                width="3vw",
                disabled=True,
            ),
            ui.popover(
                ui.input_action_button(
                    f"thumbs_down_{step_id}",
                    "👎",
                    class_="btn btn-danger p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.input_text_area(
                    f"reasoning_thumbs_down_{step_id}",
                    "thumbs down feedback",
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder="Please provide your feedback about what you didn't like or what could be improved.",
                ),
                ui.input_action_button(
                    f"save_reasoning_thumbs_down_{step_id}",
                    "📝",
                    class_="btn btn-secondary p-0",
                    width="3vw",
                ),
                id=f"thumbs_down_popover_{step_id}",
            ),
            ui.popover(
                ui.input_action_button(
                    f"save_{step_id}",
                    "💾",
                    class_="btn btn-secondary p-0",
                    width="3vw",
                    disabled=True,
                ),
                ui.input_text_area(
                    f"reasoning_{step_id}",
                    generation_step,
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder="Please provide reasoning for your edits and/or feedback if applicable. this will help us improve the quality of our LLM",
                ),
                ui.input_action_button(
                    f"save_reasoning_{step_id}",
                    "📝",
                    class_="btn btn-secondary p-0",
                    width="3vw",
                ),
                id=f"save_reasoning_popover_{step_id}",
            ),
            ui.input_action_button(
                f"{step_id}_continue",
                "➡️",
                class_="btn btn-primary p-0",
                width="3vw",
                disabled=True,
            ),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )


shared_state = {
    "background_trace": None,
    "field_of_invention_trace": None,
    "summary_trace": None,
    "primary_invention_trace": None,
    "technology_trace": None,
    "description_trace": None,
    "product_trace": None,
}


# Define Server Logic
def server(input, output, session):
    """
    server function for shiny app
    """
    # Create a reactive value to store the generated primary invention
    generated_background = reactive.Value("")
    generated_field_of_invention = reactive.Value("")
    generated_summary = reactive.Value("")
    generated_primary_invention = reactive.Value("")
    generated_technology = reactive.Value("")
    generated_description = reactive.Value("")
    generated_product = reactive.Value("")

    @reactive.Effect
    @reactive.event(input.generate)
    def on_start_generation():
        # Collect input values
        antigen = input.antigen()
        disease = input.disease()

        ui.update_action_button("thumbs_up_background", disabled=False)
        ui.update_action_button("thumbs_down_background", disabled=False)
        ui.update_action_button("background_continue", disabled=False)

        if not antigen and not disease:
            ui.notification_show(
                "missing antigen and disease", duration=2, type="error"
            )
            return
        if not antigen:
            ui.notification_show("missing antigen", duration=2, type="error")
            return
        if not disease:
            ui.notification_show("missing disease", duration=2, type="error")
            return

        # Log the collected inputs for debugging
        logging.info(f"Antigen: {antigen}")
        logging.info(f"Disease: {disease}")

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_background.set(response)
        else:
            response = generate_background(antigen, disease)

            shared_state["background_trace"] = langfuse.trace(
                id=response.trace_id
            )

            # Debugging: Log the response
            logging.info("Generated Background")

            generated_background.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.background_continue)
    def on_background_continue():
        background_edit = input.background()
        antigen = input.antigen()
        disease = input.disease()

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_field_of_invention.set(response)

            ui.update_action_button("background_continue", disabled=True)
            ui.update_action_button("field_of_invention_continue", disabled=False)
        
        else:
            response = generate_field_of_invention(background_edit, antigen, disease)

            shared_state["field_of_invention_trace"] = langfuse.trace(id=response.trace_id)

            logging.info("Generated Field of Invention")
            ui.update_action_button("background_continue", disabled=True)
            ui.update_action_button("field_of_invention_continue", disabled=False)
            generated_field_of_invention.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.field_of_invention_continue)
    def on_field_of_invention_continue():
        field_of_invention_edit = input.field_of_invention()
        antigen = input.antigen()
        disease = input.disease()

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_summary.set(response)

            ui.update_action_button("field_of_invention_continue", disabled=True)
            ui.update_action_button("summary_continue", disabled=False)
        else:
            response = generate_summary(
                field_of_invention_edit, antigen, disease
            )

            shared_state["summary_trace"] = langfuse.trace(
                id=response.trace_id
            )

            logging.info("Generated Summary")
            ui.update_action_button("field_of_invention_continue", disabled=True)
            ui.update_action_button("summary_continue", disabled=False)
            generated_summary.set(response.prediction)


    @reactive.Effect
    @reactive.event(input.summary_continue)
    def on_summary_continue():
        summary_edit = input.summary()
        antigen = input.antigen()
        disease = input.disease()

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_primary_invention.set(response)

            ui.update_action_button("summary_continue", disabled=True)
            ui.update_action_button("primary_invention_continue", disabled=False)
        else:
            response = generate_primary_invention(summary_edit, antigen, disease)

            shared_state["primary_invention_trace"] = langfuse.trace(
                id=response.trace_id
            )

            logging.info("Generated Primary Invention")
            ui.update_action_button("summary_continue", disabled=True)
            ui.update_action_button("primary_invention_continue", disabled=False)
            generated_primary_invention.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.primary_invention_continue)
    def on_primary_invention_continue():
        primary_invention_edit = input.primary_invention()
        antigen = input.antigen()
        disease = input.disease()
        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_technology.set(response)

            ui.update_action_button("primary_invention_continue", disabled=True)
            ui.update_action_button("technology_continue", disabled=False)
        else:
            response = generate_technology_platform(
                primary_invention_edit,
                antigen,
                disease,
            )

            shared_state["technology_trace"] = langfuse.trace(
                id=response.trace_id
            )

            logging.info("Generated Technology")
            ui.update_action_button("primary_invention_continue", disabled=True)
            ui.update_action_button("technology_continue", disabled=False)
            generated_technology.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.technology_continue)
    def on_technology_continue():
        technology_edit = input.technology()
        antigen = input.antigen()
        disease = input.disease()

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_description.set(response)

            ui.update_action_button("technology_continue", disabled=True)
            ui.update_action_button("description_continue", disabled=False)
        else:
            response = generate_description_of_invention(
                technology_edit, antigen, disease
            )

            shared_state["description_trace"] = langfuse.trace(
                id=response.trace_id
            )

            logging.info("Generated Description Of Invention")
            ui.update_action_button("technology_continue", disabled=True)
            ui.update_action_button("description_continue", disabled=False)
            generated_description.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.description_continue)
    def on_description_continue():
        description_edit = input.description()
        antigen = input.antigen()
        disease = input.disease()

        if ENVIRONMENT == "development":
            response = f"Antigen: {antigen} and Disease: {disease}"
            generated_product.set(response)

            ui.update_action_button("description_continue", disabled=True)
            ui.update_action_button("product_retry", disabled=False)
        else:
            response = generate_product(description_edit, antigen, disease)

            shared_state["product_trace"] = langfuse.trace(
                id=response.trace_id
            )

            logging.info("Generated product or products")
            ui.update_action_button("description_continue", disabled=True)
            ui.update_action_button("product_retry", disabled=False)
            generated_product.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.product_retry)
    def on_product_continue():
        """
        Clean up all the output cards
        """
        generated_background.unset()
        generated_field_of_invention.unset()
        generated_summary.unset()
        generated_primary_invention.unset()
        generated_technology.unset()
        generated_description.unset()
        generated_product.unset()              

    @output
    @render.ui
    def background_card():
        return generate_card_content(generated_background(), "background")
    

    # UI renderers
    @output
    @render.ui
    def field_of_invention_card():
        return generate_card_content(
            generated_field_of_invention(), "field_of_invention"
        )

    @output
    @render.ui
    def summary_card():
        return generate_card_content(generated_summary(), "summary")

    @output
    @render.ui
    def primary_invention_card():
        return generate_card_content(generated_primary_invention(), "primary_invention")

    @output
    @render.ui
    def technology_card():
        return generate_card_content(generated_technology(), "technology")
    
    @output
    @render.ui
    def description_card():
        return generate_card_content(generated_description(), "description")

    @output
    @render.ui
    def product_card():
        return generate_card_content(generated_product(), "product")

    # Background_and_need
    @reactive.Effect
    @reactive.event(input.thumbs_up_background)
    def on_background_thumbs_up():
        ui.update_action_button("thumbs_down_background", disabled=True)
        ui.update_action_button("thumbs_up_background", disabled=True)
        ui.notification_show("That's an Interesting Background!", duration=2, type="message")

        trace = shared_state["background_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_background)
    def on_background_thumbs_down():
        ui.update_action_button("thumbs_up_background", disabled=True)
        ui.update_action_button("thumbs_down_background", disabled=True)
        ui.notification_show("Not the best Background 🤷🏽‍♂️", duration=2, type="error")

        trace = shared_state["background_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.background)
    def on_background_editable_content():
        print("watching changes...")
        if input.background() != "":
            print("content changed!")
            ui.update_action_button("save_background", disabled=False)

    @reactive.Effect
    @reactive.event(input.save_background)
    def on_save_background():
        print("save")
        ui.update_action_button("save_background", disabled=True)

        background_edit = input.background()
        if ENVIRONMENT == "development":
            generated_background.set(background_edit)
        else:
            generated_background.set(background_edit)
            trace = shared_state["background_trace"]
            if trace:
                trace.event(
                    name="edit_background",
                    input="The input to this event is the background generated by the LLM",
                    output=background_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_reasoning_background)
    def on_save_reasoning_background():
        print("save reasoning")
        reasoning = input.reasoning_background()

        trace = shared_state["background_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_background",
                input="the user comments on the background and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_reasoning_background", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_background)
    def on_save_reasoning_background_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_background()
        trace = shared_state["background_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_background",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button(
            "save_reasoning_thumbs_down_background", disabled=True
        )
    
    # Field of invention feedback logic
    @reactive.Effect
    @reactive.event(input.thumbs_up_field_of_invention)
    def on_field_of_invention_thumbs_up():
        ui.update_action_button("thumbs_down_field_of_invention", disabled=True)
        ui.update_action_button("thumbs_up_field_of_invention", disabled=True)
        ui.notification_show("thumbs up_field_of_invention", duration=2, type="message")

        trace = shared_state["field_of_invention_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_field_of_invention)
    def on_field_of_invention_thumbs_down():
        ui.update_action_button("thumbs_up_field_of_invention", disabled=True)
        ui.update_action_button("thumbs_down_field_of_invention", disabled=True)
        ui.notification_show("thumbs down_field_of_invention", duration=2, type="error")

        trace = shared_state["field_of_invention_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.field_of_invention)
    def on_field_of_invention_editable_content():
        print("watching changes...")
        if input.field_of_invention() != "":
            print("content changed!")
            ui.update_action_button("save_field_of_invention", disabled=False)

    @reactive.Effect
    @reactive.event(input.save_field_of_invention)
    def on_save_field_of_invention():
        print("save")
        ui.update_action_button("save_field_of_invention", disabled=True)

        field_of_invention_edit = input.field_of_invention()
        if ENVIRONMENT == "development":
            generated_field_of_invention.set(field_of_invention_edit)
        else:
            generated_field_of_invention.set(field_of_invention_edit)
            trace = shared_state["field_of_invention_trace"]
            if trace:
                trace.event(
                    name="edit_field_of_invention",
                    input="The input to this event is the field of invention generated by the LLM",
                    output=field_of_invention_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_reasoning_field_of_invention)
    def on_save_reasoning_field_of_invention():
        print("save reasoning")
        reasoning = input.reasoning_field_of_invention()

        trace = shared_state["field_of_invention_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_primary_invention",
                input="the user comments on the field of invention and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_reasoning_field_of_invention", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_field_of_invention)
    def on_save_reasoning_field_of_invention_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_field_of_invention()
        trace = shared_state["field_of_invention_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_field_of_invention",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button(
            "save_reasoning_thumbs_down_field_of_invention", disabled=True
        )
    
    # Primary invention feedback logic
    @reactive.Effect
    @reactive.event(input.thumbs_up_primary_invention)
    def on_primary_invention_thumbs_up():
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.notification_show("thumbs up_primary_invention", duration=2, type="message")

        trace = shared_state["primary_invention_trace"]

        if trace:
            trace.update(metadata={"feedback": "positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_primary_invention)
    def on_primary_invention_thumbs_down():
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.notification_show("thumbs down_primary_invention", duration=2, type="error")

        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.update(metadata={"feedback": "negative"})
        print("thumbs down")

    @reactive.Effect()
    @reactive.event(input.primary_invention)
    def on_primary_invention_editable_content():
        print("watching changes...")
        if input.primary_invention() != "":
            print("content changed!")
            ui.update_action_button("save_primary_invention", disabled=False)

    @reactive.Effect
    @reactive.event(input.save_primary_invention)
    def on_save_primary_invention():
        print("save")
        ui.update_action_button("save_primary_invention", disabled=True)

        primary_invention_edit = input.primary_invention()
        if ENVIRONMENT == "development":
            generated_primary_invention.set(primary_invention_edit)
        else:
            generated_primary_invention.set(primary_invention_edit)
            trace = shared_state["primary_invention_trace"]
            if trace:
                trace.event(
                    name="edit_primary_invention",
                    input="The input to this event is the primary invention generated by the LLM",
                    output=primary_invention_edit,
                )

    @reactive.Effect
    @reactive.event(input.save_reasoning_primary_invention)
    def on_save_reasoning_primary_invention():
        print("save reasoning")
        reasoning = input.reasoning_primary_invention()

        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(
                name="edit_reasoning_primary_invention",
                input="the user comments on the primary invention and the changes they made",
                output=reasoning,
            )

        ui.update_action_button("save_reasoning_primary_invention", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_primary_invention)
    def on_save_reasoning_primary_invention_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_primary_invention()
        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_primary_invention",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button(
            "save_reasoning_thumbs_down_primary_invention", disabled=True
        )

    

# Run App
app = shiny.App(app_ui, server)
app.run()
