from shiny import reactive, render, ui
import shiny
import asyncio
from make_patent_component import primary_invention, trace_id, langfuse
import logging


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
            ui.output_ui("content_cards", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("field_of_invention_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("background_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("summary_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("technology_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("description_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("product_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("uses_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        height="100vh",
    )
)

def generate_card_content(response_text, generation_step):
    response_text = str(response_text)
    step_id = generation_step.lower().replace(" ", "_")
    
    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}", 
                generation_step, 
                value=response_text, 
                width="100%", 
                height="100%", 
                rows=8,
                resize="none"
            ),
            class_="card-body h-100"
        ),
        ui.div(
            ui.input_action_button(
                f"thumbs_up_{step_id}", 
                "👍", 
                class_="btn btn-success p-0", 
                width="3vw",
                disabled=True
            ),
            ui.popover(
                ui.input_action_button(
                    f"thumbs_down_{step_id}", 
                    "👎", 
                    class_="btn btn-danger p-0", 
                    width="3vw",
                    disabled=True
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
                    width="3vw"
                ),
                id=f"thumbs_down_popover_{step_id}"
            ),
            ui.popover(
                ui.input_action_button(
                    f"save_{step_id}", "💾 ", 
                    class_="btn btn-secondary p-0", 
                    width="3vw", 
                    disabled=True
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
                    width="3vw"
                ),
                id=f"{step_id}_popover"
            ),
            ui.input_action_button(
                f"{step_id}_continue",
                "➡️",
                class_="btn btn-primary p-0",
                width="3vw",
            ),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )


# Define Server Logic
def server(input, output, session):
    primary_invention_trace = langfuse.trace(id=trace_id)
    # Create a reactive value to store the generated content
    generated_content = reactive.Value("")
    generated_field_of_invention = reactive.Value("")
    generated_background = reactive.Value("")
    generated_summary = reactive.Value("")
    generated_technology = reactive.Value("")
    generated_description = reactive.Value("")
    generated_product = reactive.Value("")
    generated_uses = reactive.Value("")

    @reactive.Effect
    @reactive.event(input.generate)
    async def on_generate():
        # Collect input values
        antigen = input.antigen()
        disease = input.disease()

        ui.update_action_button("thumbs_up_primary_invention", disabled=False)
        ui.update_action_button("thumbs_down_primary_invention", disabled=False)

        if not antigen and not disease:
            ui.notification_show("missing antigen and disease", duration=2, type="error")
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

        # Placeholder response
        response = f"Antigen: {antigen}, Disease: {disease}"

        # Debugging: Log the response
        logging.info(f"Generated response: {response}")

        generated_content.set(response)

    @reactive.Effect
    @reactive.event(input.primary_invention_continue)
    def on_primary_invention_continue():
        ui.update_action_button("primary_invention_continue", disabled=True)
        generated_field_of_invention.set("yo")

    @reactive.Effect
    @reactive.event(input.field_of_invention_continue)
    def on_field_of_invention_continue():
        ui.update_action_button("field_of_invention_continue", disabled=True)
        generated_background.set("yo")
    
    @reactive.Effect
    @reactive.event(input.background_continue)
    def on_background_continue():
        ui.update_action_button("background_continue", disabled=True)
        generated_summary.set("yo")
    
    @reactive.Effect
    @reactive.event(input.summary_continue)
    def on_summary_continue():
        ui.update_action_button("summary_continue", disabled=True)
        generated_technology.set("yo")
    
    @reactive.Effect
    @reactive.event(input.technology_continue)
    def on_technology_continue():
        ui.update_action_button("technology_continue", disabled=True)
        generated_description.set("yo")

    @reactive.Effect
    @reactive.event(input.description_continue)
    def on_description_continue():
        ui.update_action_button("description_continue", disabled=True)
        generated_product.set("yo")

    @reactive.Effect
    @reactive.event(input.product_continue)
    def on_product_continue():
        ui.update_action_button("product_continue", disabled=True)
        generated_uses.set("yo")

    # Use render.ui to auto-refresh content when generated_content changes
    @output
    @render.ui
    def content_cards():
        return generate_card_content(generated_content(), "primary_invention")
    
    # Use render.ui to auto-refresh content when generated_content changes
    @output
    @render.ui
    def field_of_invention_card():
        return generate_card_content(generated_field_of_invention(), "field_of_invention")
    
    @output
    @render.ui
    def background_card():
        return generate_card_content(generated_background(), "background")

    @output
    @render.ui
    def summary_card():
        return generate_card_content(generated_summary(), "summary")

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

    @output
    @render.ui
    def uses_card():
        return generate_card_content(generated_uses(), "uses")
    
    @reactive.Effect
    @reactive.event(input.thumbs_up_primary_invention)
    def on_thumbs_up():
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.notification_show("thumbs up_primary_invention", duration=2, type="message")

        primary_invention_trace.update(metadata={"feedback":"positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_primary_invention)
    def on_thumbs_down():
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.notification_show("thumbs down_primary_invention", duration=2, type="error")

        primary_invention_trace.update(metadata={"feedback":"negative"})
        print("thumbs down")


    @reactive.Effect()
    @reactive.event(input.primary_invention)
    def on_editable_content():
        print("watching changes...")
        if input.primary_invention() != "":
            print("content changed!")
            ui.update_action_button("save_primary_invention", disabled=False)
        

    @reactive.Effect
    @reactive.event(input.save_primary_invention)
    def on_save():
        print("save")
        ui.update_action_button("save_primary_invention", disabled=True)

        primary_invention_edit = input.primary_invention()
        primary_invention_trace.event(name="edit_primary_invention", input="The input to this event is the primary invention generated by the LLM", output=primary_invention_edit)
    
    @reactive.Effect
    @reactive.event(input.save_reasoning_primary_invention)
    def on_save_reasoning_primary_invention():
        print("save reasoning")
        reasoning = input.reasoning_primary_invention()

        primary_invention_trace.event(
            name="primary_invention_reasoning",
            input="the user comments on the primary invention and the changes they made",
            output=reasoning,
        )

        ui.update_action_button("save_reasoning_primary_invention", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_primary_invention)
    def on_save_reasoning_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_primary_invention()
        
        primary_invention_trace.event(
            name="thumbs_down_reasoning_primary_invention",
            input="the user provides negative feedback",
            output=reasoning,
        )
        ui.update_action_button("save_reasoning_thumbs_down_primary_invention", disabled=True)    

# Run App
app = shiny.App(app_ui, server)
app.run()
